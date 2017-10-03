require(["esri/map", "esri/layers/FeatureLayer", "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleLineSymbol", "esri/renderers/SimpleRenderer", "esri/graphic",
  "esri/Color", "esri/lang", "esri/geometry/webMercatorUtils", "esri/tasks/query",
  "esri/tasks/QueryTask", "esri/dijit/HomeButton", "esri/dijit/Scalebar", "esri/InfoTemplate",
  "esri/config", "esri/dijit/Print", "esri/dijit/Legend", "esri/tasks/LegendLayer",
  "esri/dijit/FeatureTable", "esri/dijit/InfoWindow", "esri/layers/ArcGISDynamicMapServiceLayer",
  "dojo/number", "dijit/popup", "dijit/TooltipDialog", "dojo/_base/array", "dojo/on", "dojo/dom", "dijit/Dialog",
  "dijit/layout/BorderContainer", "dijit/form/ComboBox", "dijit/form/Button", "dijit/layout/TabContainer", "dijit/layout/ContentPane",
  "dojo/store/Memory", "dojo/promise/all", "dojo/dom-style", "dojo/domReady!", "dojo/dom-construct", "dojo/ready"], 
  function(Map, FeatureLayer, SimpleFillSymbol, SimpleLineSymbol, SimpleRenderer, Graphic,
  Color, esriLang, webMercatorUtils, Query, QueryTask, HomeButton, Scalebar, InfoTemplate, esriConfig, Print, Legend,
   LegendLayer, FeatureTable, InfoWindow, ArcGISDynamicMapServiceLayer, number, dijitPopup, TooltipDialog, arrayUtils, on, dom, Dialog, Memory, all, domStyle, domConstruct,
   ready){


      map = new Map("map",{
          basemap: "topo-vector",
          center: [-92, 31],
          zoom: 7,
      });

      loading = dom.byId("wait");
      map.on("load", Popup);
      function Popup(event){
        dom.byId("wait").style.display = "block";
      };

      on(dom.byId("click"), "click", closeIt);

      function closeIt(event){
          dom.byId("wait").style.display = "none";
      };

      on(dom.byId("helpClick"), "click", helpOpen);

      function helpOpen(event){
          dom.byId("pdf").style.display = "block";
      };

      on(dom.byId("helpClickClose"), "click", helpClose);

      function helpClose(event){
          dom.byId("pdf").style.display = "none";
      };

      var template = new InfoTemplate();
      template.setTitle("Project: ${PROJECT}");
      template.setContent("<b>Project: </b>${PROJECT}<br/>" +
                          "<b>Federal Number: </b>${FEDERAL_NUM}<br/>" +
                          "<b>Legacy Project: </b>${LEGACY_PROJECT}<br/>" +
                          "<b>Route: </b>${ROUTE}<br/><br/>" +
                          "<mark><b>PROJECT LOCATION:</b></mark><br/>" +
                          "<b>DOTD District: </b>${DISTRICT}<br/>" +
                          "<b>Parish: </b>${PARISH_NAME}<br/>" +
                          "<b>Urbanized Area: </b>${URBANIZED AREA}<br/>" +
                          "<b>House District: </b>${House_District}<br/>" +
                          "<b>Senate District: </b>${Senate_District}<br/><br/>" +
                          "<mark><b>PROJECT CONTACT:</b></mark><br/>" +
                          "<b>Manager: </b>${MANAGER}<br/><br/>" +
                          "<mark><b>PROJECT COSTS:</b></mark><br/>" +
                          "<b>Fund: </b>${FUND}<br/>" +
                          "<b>Estimated Cost: </b><br/>" +
                          "<b>Letting Cost: </b>${LETTING_COST}<br/><br/>");

      var district = new FeatureLayer ("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/FeatureServer/11",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["District_Name", "Sq_Miles"]
      });

      var districtOutline = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/11",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["District_Name", "Sq_Miles"]
      });

      var stateOutline = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/LaDOTDBaseMap/MapServer/21",{
          mode: FeatureLayer.MODE_ONDEMAND,
      });

      var parishOutline = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/10",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["Name", "Population"]
      });

      var senateDistrictOutline = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/8",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["*"]
      });

      var selectedSenate = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/8",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["*"]
      });

      var houseDistrictOutline = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/9",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["*"]
      });

      var selectedHouse = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/9", {
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["*"]
      });

      var parishOutlines = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/10",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          id: "Parish",
          outFields: ["Name", "Population"]
      });

      var testURL = "https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2019_Roadshow/MapServer";
      var testURLOptions = {
          "id": "testFeature",
          "opacity": 1,
          "infoTemplates": {0:{infoTemplate: template, layerUrl: null, resourceInfo: null}, 1:{infoTemplate: template, layerUrl: null, resourceInfo: null},
          2:{infoTemplate: template, layerUrl: null, resourceInfo: null}, 3:{infoTemplate: template, layerUrl: null, resourceInfo: null},
              4:{infoTemplate: template, layerUrl: null, resourceInfo: null}, 5:{infoTemplate:template, layerUrl:null, resourceInfo:null},
          6:{infoTemplate: template, layerUrl: null, resourceInfo: null}, 7:{infoTemplate: template, layerUrl: null, resourceInfo: null}}
      };

      var parishProjectLayer = new ArcGISDynamicMapServiceLayer(testURL, testURLOptions);
      parishProjectLayer.setVisibleLayers([0,1,2,3,4,5,6,7]);

      var districtProjectLayer = new ArcGISDynamicMapServiceLayer(testURL, testURLOptions);
      districtProjectLayer.setVisibleLayers([0,1,2,3,4,5,6,7]);

      var houseDistrictProjectLayer = new ArcGISDynamicMapServiceLayer(testURL, testURLOptions);
      houseDistrictProjectLayer.setVisibleLayers([0,1,2,3,4,5,6,7]);

      var senateDistrictProjectLayer = new ArcGISDynamicMapServiceLayer(testURL, testURLOptions);
      senateDistrictProjectLayer.setVisibleLayers([0,1,2,3,4,5,6,7]);

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
          new Color([0,0,0,1]),3),
          new Color([125,125,125,0.35])
      );

      //Create a new renderer for the parishes outline
      var parishSymbol = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
          new Color([0,0,0,1]),3),
          new Color([125,125,125,0.00])
      );

      //Create a selected color
      var selectSymbol = new SimpleFillSymbol(
          SimpleFillSymbol.STYLE_SOLID,
          new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
          new Color([255,255,0,1]),3),
          new Color([255,255,153,0.15])
      );

      //Add the new renderers for the parishes and the state outline
      parishOutlines.setRenderer(new SimpleRenderer(parishSymbol));
      stateOutline.setRenderer(new SimpleRenderer(stateSymbol));

    //   dialog = new TooltipDialog({
    //       id: "tooltipDialog",
    //       style: "position: absolute; width: 250px; font: normal normal normal 10pt Helvetica; z-index:100"
    //   });
    //   dialog.startup();

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

      //Create a legend layer for the printing option
      var legendLayer = new LegendLayer();
      legendLayer.layerId = "testFeature";

      //Add a print button for the user
    //   var printer = new Print({
    //       map: map,
    //       url: "https://utility.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
    //       templates: [{
    //           label: "11x17 Landscape",
    //           format: "PDF",
    //           layout: "A3 Landscape",
    //           layoutOptions:{
    //               titleText: "Roadshow Map",
    //               legendLayers: [legendLayer]
    //           }
    //       }, {
    //           label: "11x17 Portrait",
    //           format: "PDF",
    //           layout: "A3 Portrait",
    //           layoutOptions:{
    //               titleText: "Roadshow Map",
    //               legendLayers: [legendLayer]
    //           }
    //       }, {
    //           label: "8x11 Landscape",
    //           format: "PDF",
    //           layout: "A4 Landscape",
    //           layoutOptions:{
    //               titleText: "Roadshow Map",
    //               legendLayers: [legendLayer]
    //           }
    //       }, {
    //           label: "8x11 Portrait",
    //           format: "PDF",
    //           layout: "A4 Portrait",
    //           layoutOptions:{
    //               titleText: "Roadshow Map",
    //               legendLayers: [legendLayer]
    //           }
    //       }]
    //   }, dom.byId("printButton"));
    //   printer.startup();

      //Add a legend to the map
      var legend = new Legend({
          map: map,
      }, "legendDiv");


      map.addLayer(stateOutline);

      //Add onClick function for parishes
      on(dom.byId("parishes"), "click", initFunction);

      //Define the initFunction
      function initFunction(results){
          map.removeLayer(stateOutline);
          map.removeLayer(district);
          map.removeLayer(districtOutline);
          map.removeLayer(houseDistrictOutline);
          map.removeLayer(selectedHouse);
          map.removeLayer(senateDistrictOutline);
          map.removeLayer(selectedSenate);
          map.removeLayer(districtProjectLayer);
          map.removeLayer(houseDistrictProjectLayer);
          map.removeLayer(senateDistrictProjectLayer);
          map.addLayer(parishOutlines);
          document.getElementById("applyFilter").style.display = "block";
          document.getElementById("Filter").style.display = "block";
          document.getElementById("resetFilter").style.display = "block";
          document.getElementById("parishFilter").style.display = "inline-block";
          document.getElementById("houseFilter").style.display = "none";
          document.getElementById("applyHouseFilter").style.display = "none";
          document.getElementById("resetHouseFilter").style.display = "none";
          document.getElementById("districtFilter").style.display = "none";
          document.getElementById("applyDistrictFilter").style.display = "none";
          document.getElementById("resetDistrictFilter").style.display = "none";
          document.getElementById("senateFilter").style.display = "none";
          document.getElementById("applySenateFilter").style.display = "none";
          document.getElementById("resetSenateFilter").style.display = "none";

          //Create function to select parish from list
          document.getElementById("applyFilter").onclick = function parishFilter(){
              parishType = document.getElementById("parishFilter").value;
              var renderer = new SimpleRenderer(selectSymbol);
              parishOutline.setDefinitionExpression("Name = '" + parishType + "'");
              parishOutline.setRenderer(renderer);
              map.addLayer(parishOutline);
              var query = new Query();
              query.where = "Name = '" + parishType + "'";
              parishOutlines.queryFeatures(query, function(result){
                  map.setExtent(result.features[0].geometry.getExtent(), true);
              });

              //Create a layer definition for each layer within the Map Service
              var layerDefinitions = [];
              layerDefinitions[0] = "PARISH_NAME LIKE '%" + parishType + "%'";
              layerDefinitions[1] = "PARISH_NAME LIKE '%" + parishType + "%'";
              layerDefinitions[2] = "PARISH_NAME LIKE '%" + parishType + "%'";
              layerDefinitions[3] = "PARISH_NAME LIKE '%" + parishType + "%'";
              layerDefinitions[4] = "PARISH_NAME LIKE '%" + parishType + "%'";
              layerDefinitions[5] = "PARISH_NAME LIKE '%" + parishType + "%'";
              layerDefinitions[6] = "PARISH_NAME LIKE '%" + parishType + "%'";
              layerDefinitions[7] = "PARISH_NAME LIKE '%" + parishType + "%'";

              //Apply the definitions to the feature
              parishProjectLayer.setLayerDefinitions(layerDefinitions);
              parishProjectLayer.show();

              //Add the feature to the map
              map.addLayer(parishProjectLayer);
              
              //Create a legend for the parishes
              legend.startup();
              legend.refresh([{
                  layer: parishOutline,
                  title: "Selected Parish"
              },{
                  layer: parishProjectLayer,
                  title: "Projects"
              }]);

          }

          document.getElementById("resetFilter").onclick = function resetParishFilter(){
              map.removeLayer(parishOutline);
              map.removeLayer(parishProjectLayer);
          }
      }

      //Add onClick function for DOTD District
      on(dom.byId("districts"), "click", initDistrictFunction);

      //Define the initDistrictFunction
      function initDistrictFunction(results){
          map.removeLayer(stateOutline);
          map.removeLayer(parishOutlines);
          map.removeLayer(parishOutline);
          map.removeLayer(houseDistrictOutline);
          map.removeLayer(selectedHouse);
          map.removeLayer(senateDistrictOutline);
          map.removeLayer(selectedSenate);
          map.removeLayer(parishProjectLayer);
          map.removeLayer(houseDistrictProjectLayer);
          map.removeLayer(senateDistrictProjectLayer);
          map.addLayer(district);
          document.getElementById("Filter").style.display = "none";
          document.getElementById("parishFilter").style.display = "none";
          document.getElementById("applyFilter").style.display = "none";
          document.getElementById("resetFilter").style.display = "none";
          document.getElementById("houseFilter").style.display = "none";
          document.getElementById("applyHouseFilter").style.display = "none";
          document.getElementById("resetHouseFilter").style.display = "none";
          document.getElementById("senateFilter").style.display = "none";
          document.getElementById("applySenateFilter").style.display = "none";
          document.getElementById("resetSenateFilter").style.display = "none";
          document.getElementById("districtFilter").style.display = "block";
          document.getElementById("applyDistrictFilter").style.display = "block";
          document.getElementById("resetDistrictFilter").style.display = "block";

          //Create the function to select district from list
          document.getElementById("applyDistrictFilter").onclick = function districtFilter(){
              districtType = document.getElementById("districtNameFilter").value;
              var renderer = new SimpleRenderer(selectSymbol);
              districtOutline.setDefinitionExpression("DOTD_District = '" + districtType + "'");
              districtOutline.setRenderer(renderer);
              map.addLayer(districtOutline);
              var query = new Query();
              query.where = "DOTD_District = '" + districtType + "'";
              district.queryFeatures(query, function(result){
                  map.setExtent(result.features[0].geometry.getExtent(), true);
              });

              //Create the layer definitions
              var districtLayerDefinitions = [];
              districtLayerDefinitions[0] = "District LIKE '%," + districtType + "' OR District LIKE '%" + districtType + ", %' OR District = '" + districtType + "'";
              districtLayerDefinitions[1] = "District LIKE '%," + districtType + "' OR District LIKE '%" + districtType + ", %' OR District = '" + districtType + "'";
              districtLayerDefinitions[2] = "District LIKE '%," + districtType + "' OR District LIKE '%" + districtType + ", %' OR District = '" + districtType + "'";
              districtLayerDefinitions[3] = "District LIKE '%," + districtType + "' OR District LIKE '%" + districtType + ", %' OR District = '" + districtType + "'";
              districtLayerDefinitions[4] = "District LIKE '%," + districtType + "' OR District LIKE '%" + districtType + ", %' OR District = '" + districtType + "'";
              districtLayerDefinitions[5] = "District LIKE '%," + districtType + "' OR District LIKE '%" + districtType + ", %' OR District = '" + districtType + "'";
              districtLayerDefinitions[6] = "District LIKE '%," + districtType + "' OR District LIKE '%" + districtType + ", %' OR District = '" + districtType + "'";
              districtLayerDefinitions[7] = "District LIKE '%," + districtType + "' OR District LIKE '%" + districtType + ", %' OR District = '" + districtType + "'";

              //Apply the definitions
              districtProjectLayer.setLayerDefinitions(districtLayerDefinitions);
              districtProjectLayer.show();

              //Add layers to map
              map.addLayer(districtProjectLayer);

              //Create a legend
              legend.startup();
              legend.refresh([{
                  layer: districtOutline,
                  title: "Selected District"
              },{
                  layer: districtProjectLayer,
                  title: "Projects"
              }]);
          }

          document.getElementById("resetDistrictFilter").onclick = function resetDistrictFilter(){
              map.removeLayer(districtOutline);
              map.removeLayer(districtProjectLayer);
          }
      }

      //Add onClick function for House districts
      on(dom.byId("houseDistricts"), "click", initHouseFunction);

      //Define the initHouseFunction
      function initHouseFunction(results){
          map.removeLayer(stateOutline);
          map.removeLayer(parishOutline);
          map.removeLayer(parishOutlines);
          map.removeLayer(district);
          map.removeLayer(districtOutline);
          map.removeLayer(senateDistrictOutline);
          map.removeLayer(selectedSenate);
          map.removeLayer(parishProjectLayer);
          map.removeLayer(districtProjectLayer);
          map.removeLayer(senateDistrictProjectLayer);
          map.addLayer(houseDistrictOutline);
          document.getElementById("Filter").style.display = "none";
          document.getElementById("parishFilter").style.display = "none";
          document.getElementById("applyFilter").style.display = "none";
          document.getElementById("resetFilter").style.display = "none";
          document.getElementById("districtFilter").style.display = "none";
          document.getElementById("applyDistrictFilter").style.display = "none";
          document.getElementById("resetDistrictFilter").style.display = "none";
          document.getElementById("senateFilter").style.display = "none";
          document.getElementById("applySenateFilter").style.display = "none";
          document.getElementById("resetSenateFilter").style.display = "none";
          document.getElementById("houseFilter").style.display = "block";
          document.getElementById("applyHouseFilter").style.display = "block";
          document.getElementById("resetHouseFilter").style.display = "block";

          //Create the function to select House district from list
          document.getElementById("applyHouseFilter").onclick = function houseFilter(){
              houseType = document.getElementById("houseNameFilter").value;
              var renderer = new SimpleRenderer(selectSymbol);
              selectedHouse.setDefinitionExpression("REP_DISTRICT_NO = '" + houseType + "'");
              selectedHouse.setRenderer(renderer);
              map.addLayer(selectedHouse);
              var query = new Query();
              query.where = "REP_DISTRICT_NO = '" + houseType + "'";
              houseDistrictOutline.queryFeatures(query, function(result){
                  map.setExtent(result.features[0].geometry.getExtent(), true);
              });

              //Create the layer definitions
              var houseDistrictLayerDefinitions = [];
              houseDistrictLayerDefinitions[0] = "House_District LIKE '%," + houseType + "' OR House_District LIKE '%" + houseType + ", %' OR House_District = '" + houseType + "'";
              houseDistrictLayerDefinitions[1] = "House_District LIKE '%," + houseType + "' OR House_District LIKE '%" + houseType + ", %' OR House_District = '" + houseType + "'";
              houseDistrictLayerDefinitions[2] = "House_District LIKE '%," + houseType + "' OR House_District LIKE '%" + houseType + ", %' OR House_District = '" + houseType + "'";
              houseDistrictLayerDefinitions[3] = "House_District LIKE '%," + houseType + "' OR House_District LIKE '%" + houseType + ", %' OR House_District = '" + houseType + "'";
              houseDistrictLayerDefinitions[4] = "House_District LIKE '%," + houseType + "' OR House_District LIKE '%" + houseType + ", %' OR House_District = '" + houseType + "'";
              houseDistrictLayerDefinitions[5] = "House_District LIKE '%," + houseType + "' OR House_District LIKE '%" + houseType + ", %' OR House_District = '" + houseType + "'";
              houseDistrictLayerDefinitions[6] = "House_District LIKE '%," + houseType + "' OR House_District LIKE '%" + houseType + ", %' OR House_District = '" + houseType + "'";
              houseDistrictLayerDefinitions[7] = "House_District LIKE '%," + houseType + "' OR House_District LIKE '%" + houseType + ", %' OR House_District = '" + houseType + "'";

              //Apply the definition onto the layers
              houseDistrictProjectLayer.setLayerDefinitions(houseDistrictLayerDefinitions);
              houseDistrictProjectLayer.show();

              //Add the layers to the map
              map.addLayer(houseDistrictProjectLayer);

              //Create a legend
              legend.startup();
              legend.refresh([{
                  layer: selectedHouse,
                  title: "Selected House District"
              },{
                  layer: houseDistrictProjectLayer,
                  title: "Projects"
              }]);
          }

          document.getElementById("resetHouseFilter").onclick = function resetHouseFilter(){
              map.removeLayer(selectedHouse);
              map.removeLayer(houseDistrictProjectLayer);
          }
      }

      //Add onClick function for Senate districts
      on(dom.byId("senateDistricts"), "click", initSenateFunction);

      //Define the initSenateFunction
      function initSenateFunction(results){
          map.removeLayer(stateOutline);
          map.removeLayer(parishOutline);
          map.removeLayer(parishOutlines);
          map.removeLayer(district);
          map.removeLayer(districtOutline);
          map.removeLayer(houseDistrictOutline);
          map.removeLayer(selectedHouse);
          map.removeLayer(parishProjectLayer);
          map.removeLayer(districtProjectLayer);
          map.removeLayer(houseDistrictProjectLayer);
          map.addLayer(senateDistrictOutline);
          document.getElementById("Filter").style.display = "none";
          document.getElementById("parishFilter").style.display = "none";
          document.getElementById("applyFilter").style.display = "none";
          document.getElementById("resetFilter").style.display = "none";
          document.getElementById("districtFilter").style.display = "none";
          document.getElementById("applyDistrictFilter").style.display = "none";
          document.getElementById("resetDistrictFilter").style.display = "none";
          document.getElementById("houseFilter").style.display = "none";
          document.getElementById("applyHouseFilter").style.display = "none";
          document.getElementById("resetHouseFilter").style.display = "none";
          document.getElementById("senateFilter").style.display = "block";
          document.getElementById("applySenateFilter").style.display = "block";
          document.getElementById("resetSenateFilter").style.display = "block";

          //Create the function to select Senate district from list
          document.getElementById("applySenateFilter").onclick = function senateFilter(){
              senateType = document.getElementById("senateNameFilter").value;
              var renderer = new SimpleRenderer(selectSymbol);
              selectedSenate.setDefinitionExpression("SEN_DISTRICT_NO = '" + senateType + "'");
              selectedSenate.setRenderer(renderer);
              map.addLayer(selectedSenate);
              var query = new Query();
              query.where = "SEN_DISTRICT_NO = '" + senateType + "'";
              senateDistrictOutline.queryFeatures(query, function(result){
                  map.setExtent(result.features[0].geometry.getExtent(), true);
              });

              //Create the definitions for the layers
              var senateDistrictLayerDefinitions = [];
              senateDistrictLayerDefinitions[0] = "Senate_District LIKE '%," + senateType + "' OR Senate_District LIKE '%" + senateType + ", %' OR Senate_District = '" + senateType + "'";
              senateDistrictLayerDefinitions[1] = "Senate_District LIKE '%," + senateType + "' OR Senate_District LIKE '%" + senateType + ", %' OR Senate_District = '" + senateType + "'";
              senateDistrictLayerDefinitions[2] = "Senate_District LIKE '%," + senateType + "' OR Senate_District LIKE '%" + senateType + ", %' OR Senate_District = '" + senateType + "'";
              senateDistrictLayerDefinitions[3] = "Senate_District LIKE '%," + senateType + "' OR Senate_District LIKE '%" + senateType + ", %' OR Senate_District = '" + senateType + "'";
              senateDistrictLayerDefinitions[4] = "Senate_District LIKE '%," + senateType + "' OR Senate_District LIKE '%" + senateType + ", %' OR Senate_District = '" + senateType + "'";
              senateDistrictLayerDefinitions[5] = "Senate_District LIKE '%," + senateType + "' OR Senate_District LIKE '%" + senateType + ", %' OR Senate_District = '" + senateType + "'";
              senateDistrictLayerDefinitions[6] = "Senate_District LIKE '%," + senateType + "' OR Senate_District LIKE '%" + senateType + ", %' OR Senate_District = '" + senateType + "'";
              senateDistrictLayerDefinitions[7] = "Senate_District LIKE '%," + senateType + "' OR Senate_District LIKE '%" + senateType + ", %' OR Senate_District = '" + senateType + "'";

              //Apply the definitions to the layers
              senateDistrictProjectLayer.setLayerDefinitions(senateDistrictLayerDefinitions);
              senateDistrictProjectLayer.show();

              //Add the layers to the map
              map.addLayer(senateDistrictProjectLayer);

              //Create a legend
              legend.startup();
              legend.refresh([{
                  layer: selectedSenate,
                  title: "Selected Senate District"
              },{
                  layer: senateDistrictProjectLayer,
                  title: "Projects"
              }]);
          }

          document.getElementById("resetSenateFilter").onclick = function resetSenateFilter(){
              map.removeLayer(selectedSenate);
              map.removeLayer(senateDistrictProjectLayer);
          }
      }
   })
