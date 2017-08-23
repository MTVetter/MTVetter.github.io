  require(["esri/map", "esri/layers/FeatureLayer", "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleLineSymbol", "esri/renderers/SimpleRenderer", "esri/graphic",
  "esri/Color", "esri/lang", "esri/tasks/query",
  "esri/tasks/QueryTask", "esri/dijit/HomeButton", "esri/dijit/Scalebar",
  "dojo/number", "dijit/popup", "dijit/TooltipDialog", "dojo/_base/array",
  "dijit/layout/BorderContainer", "dijit/form/Button", "dojo/promise/all", "dojo/dom-style", "dojo/domReady!"], 
  function(Map, FeatureLayer, SimpleFillSymbol, SimpleLineSymbol, SimpleRenderer, Graphic,
  Color, esriLang, Query, QueryTask, HomeButton, Scalebar,
   number, dijitPopup, TooltipDialog, arrayUtils, all, domStyle){

      map = new Map("map",{
          basemap: "streets",
          center: [-92, 31],
          zoom: 8
      });

      var district = new FeatureLayer ("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/DOTD_Districts/MapServer/0",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["District_Name", "Sq_Miles"]
      });

      var stateOutline = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/LaDOTDBaseMap/MapServer/21",{
          mode: FeatureLayer.MODE_ONDEMAND,
      });

      var parishOutline = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/VDMS_FirstResponder/MapServer/8",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["Name", "Population"]
      });

      var stateRoads = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/StateHighwaySystem/MapServer/2", {
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["*"]
      });

      //Create a highlight color
      var highlightSymbol = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
          new Color([255,0,0,0.85]),3),
          new Color([125,125,125,0.35])
      );

      //Create a new renderer for the state outline
      var stateSymbol = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
          new Color([0,153,0,1]),3),
          new Color([125,125,125,0.35])
      );

      //Create a new renderer for the parishes outline
      var parishSymbol = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
          new Color([0,255,0,1]),3),
          new Color([125,125,125,0.00])
      );

      //Create a selected color
      var selectSymbol = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
          new Color([0,191,255,1]),3),
          new Color([125,125,125,0.35])
      );

      //Create a selected color for state owned roads
      var roadSelectSymbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([255,255,255,1]),1);

      //Add the new renderers for the parishes and the state outline
      parishOutline.setRenderer(new SimpleRenderer(parishSymbol));
      stateOutline.setRenderer(new SimpleRenderer(stateSymbol));

      dialog = new TooltipDialog({
          id: "tooltipDialog",
          style: "position: absolute; width: 250px; font: normal normal normal 10pt Helvetica; z-index:100"
      });
      dialog.startup();

      //Add a home button to "reset" the extent to the intial level
      var home = new HomeButton({
          map: map
      }, "HomeButton");
      home.startup();

      //Add a scale bar to the map
      var scalebar = new Scalebar({
          map: map,
          scalebarUnit: "dual"
      });

      map.addLayer(stateOutline);
      map.on("load", function(){
          map.graphics.enableMouseEvents();
          map.graphics.on("mouse-out", closeGraphic);
      });

      //Add a listener for parish onClick event
      document.getElementById("parishes").onclick = function(){
          map.graphics.clear();
          map.removeLayer(stateOutline);
          map.addLayer(parishOutline);

          //Add a highlight over the parishes
          parishOutline.on("mouse-over", function(evt){
              var highlightGraphic = new Graphic(evt.graphic.geometry, highlightSymbol);
              map.graphics.add(highlightGraphic);

              //Add a popup window to parishes
              var t = "<b>${Name}</b><hr><b>Population: </b>${Population:NumberFormat}<br>";
              var content = esriLang.substitute(evt.graphic.attributes, t);
              dialog.setContent(content);
              dijitPopup.open({
                  popup: dialog,
                  x: evt.pageX,
                  y: evt.pageY
              });
          });

          //Add an on click event to create a new map
          map.graphics.on("click", mapOnClick);

          //Function to do something when a click happens
          function mapOnClick(evt){
              var selectQuery = new Query();
              selectQuery.geometry = evt.mapPoint;
              selectQuery.outFields = ["*"];
              parishOutline.selectFeatures(selectQuery, FeatureLayer.SELECT_NEW, function(features){
                  if (features !== undefined && features.length !==0){
                      var selectedGraphic = new Graphic(features[0].geometry, selectSymbol);
                      map.graphics.add(selectedGraphic);
                      map.setExtent(features[0].geometry.getExtent(), true);
                  }
              });

              var query = new Query();
              query.returnGeometry = true;
              query.outFields = ["*"];
              var QueryTask = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/VDMS_FirstResponder/MapServer/8");
              var QueryTaskWithin = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/StateHighwaySystem/MapServer/2");
              query.geometry = evt.mapPoint;
              query.spatialRelatinship = Query.SPATIAL_REL_INTERSECTS;
              QueryTaskWithin.execute(selectQuery);
              var firstGraphic = null;
              queryTask.on("complete", function(evt){
                  firstGraphic = evt.featureSet.features[0];
                  var symbol = selectSymbol;
                  map.graphics.add(firstGraphic);
              });
          }
      };

      //Add a listener for district onClick event
      document.getElementById("districts").onclick = function(){
          map.removeLayer(stateOutline);
          map.removeLayer(parishOutline);
          map.addLayer(district);

          //Add a highlight to districts when clicked
          district.on("click", function(evt){
              var selectQuery = new Query();
              selectQuery.geometry = evt.mapPoint;
              selectQuery.outFields = ["*"];
              district.selectFeatures(selectQuery, FeatureLayer.SELECT_NEW, function(features){
                  if (features !== undefined && features.length !==0){
                      var selectedGraphic = new Graphic(features[0].geometry, selectSymbol);
                      map.graphics.add(selectedGraphic);
                      map.setExtent(features[0].geometry.getExtent(), true);
                  }
              });

              //Add a popup to the clicked district
              var t = "<b>${District_Name}</b><hr><b>Square Miles: </b>${Sq_Miles:NumberFormat}<br>";
              var content = esriLang.substitute(evt.graphic.attributes, t);
              dialog.setContent(content);
              dijitPopup.open({
                  popup: dialog,
                  x: evt.pageX,
                  y: evt.pageY
              });
          });
      };

      function closeGraphic(){
          dijitPopup.close(dialog);
          map.graphics.clear();
      }
  })