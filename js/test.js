  require(["esri/map", "esri/layers/FeatureLayer", "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleLineSymbol", "esri/renderers/SimpleRenderer", "esri/graphic",
  "esri/Color", "esri/lang", "esri/geometry/webMercatorUtils", "esri/tasks/query",
  "esri/tasks/QueryTask", "esri/dijit/HomeButton", "esri/dijit/Scalebar",
  "esri/config", "esri/dijit/Print",
  "dojo/number", "dijit/popup", "dijit/TooltipDialog", "dojo/_base/array", "dojo/on", "dojo/dom",
  "dijit/layout/BorderContainer", "dijit/form/Button", "dojo/promise/all", "dojo/dom-style", "dojo/domReady!"], 
  function(Map, FeatureLayer, SimpleFillSymbol, SimpleLineSymbol, SimpleRenderer, Graphic,
  Color, esriLang, webMercatorUtils, Query, QueryTask, HomeButton, Scalebar, esriConfig, Print,
   number, dijitPopup, TooltipDialog, arrayUtils, on, dom, all, domStyle){

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

      var senateDistrictOutline = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/LouisianaLegislativeDistricts_v2/MapServer/1",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["*"]
      });

      var houseDistrictOutline = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/LouisianaLegislativeDistricts_v2/MapServer/0",{
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
    //   map.on("load", function(){
    //       map.graphics.enableMouseEvents();
    //       map.graphics.on("mouse-out", closeGraphic);
    //   });

      //Add a listener for parish onClick event
      on(dom.byId("parishes"), "click", initFunctionality);

      function initFunctionality(evt) {
          map.addLayer(parishOutline);
          map.removeLayer(stateOutline);
          map.removeLayer(houseDistrictOutline);
          map.removeLayer(senateDistrictOutline);
          map.graphics.clear();
          var queryTask = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/VDMS_FirstResponder/MapServer/8");
          var queryTaskInterstates = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/StateHighwaySystem/MapServer/0");
          var queryTaskUSRoutes = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/StateHighwaySystem/MapServer/1");
          var queryTaskLARoutes = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/StateHighwaySystem/MapServer/2");

          //identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.
          //If this null is or not available the query operation will not work.  Otherwise it will do a http post via the proxy.
          esriConfig.defaults.io.proxyUrl = "/proxy/";
          esriConfig.defaults.io.alwaysUseProxy = false;

          // Query
          var query = new Query();
          query.returnGeometry = true;
          query.outSpatialReference = {
            "wkid": 102100
          };

          var currentClick = null;

          // Listen for map onClick event
          map.on("click", function(evt) {
            map.graphics.clear();
            map.infoWindow.hide();
            currentClick = query.geometry = evt.mapPoint;
            query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            queryTask.execute(query);
          });

          var firstGraphic = null;
          // Listen for QueryTask onComplete event

          queryTask.on("complete", function(evt) {
            firstGraphic = evt.featureSet.features[0];
            var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleFillSymbol.STYLE_SOLID, new Color([100, 100, 100]), 3), new Color([255, 0, 0, 0.20]));
            firstGraphic.setSymbol(symbol);

            map.graphics.add(firstGraphic);
            map.setExtent(evt.featureSet.features[0].geometry.getExtent(), true);
            query.geometry = webMercatorUtils.webMercatorToGeographic(firstGraphic.geometry);
            query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            queryTaskInterstates.execute(query);
          });

          // Listen for QueryTask executecomplete event
          queryTaskInterstates.on("complete", function(evt) {
            var fset = evt.featureSet;
            var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2);

            var resultFeatures = fset.features;
            for (var i = 0, il = resultFeatures.length; i < il; i++) {
              var graphic = resultFeatures[i];
              graphic.setSymbol(symbol);
              map.graphics.add(graphic);
            }
            
            queryTaskUSRoutes.execute(query);
          });
          
          queryTaskUSRoutes.on("complete", function(evt){
            var fset = evt.featureSet;
            var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2);

            var resultFeatures = fset.features;
            for (var i = 0, il = resultFeatures.length; i < il; i++) {
              var graphic = resultFeatures[i];
              graphic.setSymbol(symbol);
              map.graphics.add(graphic);
            }
            
            queryTaskLARoutes.execute(query);
          });
          
          queryTaskLARoutes.on("complete", function(evt){
            var fset = evt.featureSet;
            var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2);

            var resultFeatures = fset.features;
            for (var i = 0, il = resultFeatures.length; i < il; i++) {
              var graphic = resultFeatures[i];
              graphic.setSymbol(symbol);
              map.graphics.add(graphic);
            }          
          });
      }

      //Add a listener for district onClick event
      on(dom.byId("districts"), "click", initDistrictFunctionality);

      function initDistrictFunctionality(evt) {
          map.addLayer(district);
          map.removeLayer(stateOutline);
          map.removeLayer(parishOutline);
          map.removeLayer(houseDistrictOutline);
          map.removeLayer(senateDistrictOutline);
          map.graphics.clear();
          var queryTask = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/DOTD_Districts/MapServer/0");
          var queryTaskInterstates = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/StateHighwaySystem/MapServer/0");
          var queryTaskUSRoutes = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/StateHighwaySystem/MapServer/1");
          var queryTaskLARoutes = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/StateHighwaySystem/MapServer/2");

          //identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.
          //If this null is or not available the query operation will not work.  Otherwise it will do a http post via the proxy.
          esriConfig.defaults.io.proxyUrl = "/proxy/";
          esriConfig.defaults.io.alwaysUseProxy = false;

          // Query
          var query = new Query();
          query.returnGeometry = true;
          query.outSpatialReference = {
            "wkid": 102100
          };

          var currentClick = null;

          // Listen for map onClick event
          map.on("click", function(evt) {
            map.graphics.clear();
            map.infoWindow.hide();
            currentClick = query.geometry = evt.mapPoint;
            query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            queryTask.execute(query);
          });

          var districtFirstGraphic = null;
          // Listen for QueryTask onComplete event

          queryTask.on("complete", function(evt) {
            districtFirstGraphic = evt.featureSet.features[0];
            var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleFillSymbol.STYLE_SOLID, new Color([100, 100, 100]), 3), new Color([255, 0, 0, 0.20]));
            districtFirstGraphic.setSymbol(symbol);

            map.graphics.add(districtFirstGraphic);
            map.setExtent(evt.featureSet.features[0].geometry.getExtent(), true);
            query.geometry = webMercatorUtils.webMercatorToGeographic(districtFirstGraphic.geometry);
            query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            queryTaskInterstates.execute(query);
          });

          // Listen for QueryTask executecomplete event
          queryTaskInterstates.on("complete", function(evt) {
            var fset = evt.featureSet;
            var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2);

            var resultFeatures = fset.features;
            for (var i = 0, il = resultFeatures.length; i < il; i++) {
              var graphic = resultFeatures[i];
              graphic.setSymbol(symbol);
              map.graphics.add(graphic);
            }
            
            queryTaskUSRoutes.execute(query);
          });
          
          queryTaskUSRoutes.on("complete", function(evt){
            var fset = evt.featureSet;
            var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2);

            var resultFeatures = fset.features;
            for (var i = 0, il = resultFeatures.length; i < il; i++) {
              var graphic = resultFeatures[i];
              graphic.setSymbol(symbol);
              map.graphics.add(graphic);
            }
            
            queryTaskLARoutes.execute(query);
          });
          
          queryTaskLARoutes.on("complete", function(evt){
            var fset = evt.featureSet;
            var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2);

            var resultFeatures = fset.features;
            for (var i = 0, il = resultFeatures.length; i < il; i++) {
              var graphic = resultFeatures[i];
              graphic.setSymbol(symbol);
              map.graphics.add(graphic);
            }          
          });
      }

      //Add a listener for House district onClick event
      on(dom.byId("houseDistricts"), "click", initHouseDistrictFunctionality);

      function initHouseDistrictFunctionality(evt) {
          map.addLayer(houseDistrictOutline);
          map.removeLayer(senateDistrictOutline);
          map.removeLayer(stateOutline);
          map.removeLayer(parishOutline);
          map.removeLayer(district);
          map.graphics.clear();
          var queryTaskHouseDistrict = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/LouisianaLegislativeDistricts_v2/MapServer/0");
          var queryTaskInterstates = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/StateHighwaySystem/MapServer/0");
          var queryTaskUSRoutes = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/StateHighwaySystem/MapServer/1");
          var queryTaskLARoutes = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/StateHighwaySystem/MapServer/2");

          //identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.
          //If this null is or not available the query operation will not work.  Otherwise it will do a http post via the proxy.
          esriConfig.defaults.io.proxyUrl = "/proxy/";
          esriConfig.defaults.io.alwaysUseProxy = false;

          // Query
          var queryHouse = new Query();
          queryHouse.returnGeometry = true;
          queryHouse.outSpatialReference = {
            "wkid": 102100
          };

          var currentClick = null;

          // Listen for map onClick event
          map.on("click", function(evt) {
            map.graphics.clear();
            map.infoWindow.hide();
            currentClick = queryHouse.geometry = evt.mapPoint;
            queryHouse.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            queryTaskHouseDistrict.execute(queryHouse);
          });

          var districtFirstGraphic = null;
          // Listen for QueryTask onComplete event

          queryTaskHouseDistrict.on("complete", function(evt) {
            districtFirstGraphic = evt.featureSet.features[0];
            var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleFillSymbol.STYLE_SOLID, new Color([100, 100, 100]), 3), new Color([255, 0, 0, 0.20]));
            districtFirstGraphic.setSymbol(symbol);

            map.graphics.add(districtFirstGraphic);
            map.setExtent(evt.featureSet.features[0].geometry.getExtent(), true);
            queryHouse.geometry = webMercatorUtils.webMercatorToGeographic(districtFirstGraphic.geometry);
            queryHouse.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            queryTaskInterstates.execute(queryHouse);
          });

          // Listen for QueryTask executecomplete event
          queryTaskInterstates.on("complete", function(evt) {
            var fset = evt.featureSet;
            var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2);

            var resultFeatures = fset.features;
            for (var i = 0, il = resultFeatures.length; i < il; i++) {
              var graphic = resultFeatures[i];
              graphic.setSymbol(symbol);
              map.graphics.add(graphic);
            }
            
            queryTaskUSRoutes.execute(queryHouse);
          });
          
          queryTaskUSRoutes.on("complete", function(evt){
            var fset = evt.featureSet;
            var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2);

            var resultFeatures = fset.features;
            for (var i = 0, il = resultFeatures.length; i < il; i++) {
              var graphic = resultFeatures[i];
              graphic.setSymbol(symbol);
              map.graphics.add(graphic);
            }
            
            queryTaskLARoutes.execute(queryHouse);
          });
          
          queryTaskLARoutes.on("complete", function(evt){
            var fset = evt.featureSet;
            var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2);

            var resultFeatures = fset.features;
            for (var i = 0, il = resultFeatures.length; i < il; i++) {
              var graphic = resultFeatures[i];
              graphic.setSymbol(symbol);
              map.graphics.add(graphic);
            }          
          });
      }

      //Add a listener for House district onClick event
      on(dom.byId("senateDistricts"), "click", initSenateDistrictFunctionality);

      function initSenateDistrictFunctionality(evt) {
          map.addLayer(senateDistrictOutline);
          map.removeLayer(houseDistrictOutline);
          map.removeLayer(stateOutline);
          map.removeLayer(parishOutline);
          map.removeLayer(district);
          map.graphics.clear();
          var queryTask = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/LouisianaLegislativeDistricts_v2/MapServer/1");
          var queryTaskInterstates = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/StateHighwaySystem/MapServer/0");
          var queryTaskUSRoutes = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/StateHighwaySystem/MapServer/1");
          var queryTaskLARoutes = new QueryTask("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/StateHighwaySystem/MapServer/2");

          //identify proxy page to use if the toJson payload to the geometry service is greater than 2000 characters.
          //If this null is or not available the query operation will not work.  Otherwise it will do a http post via the proxy.
          esriConfig.defaults.io.proxyUrl = "/proxy/";
          esriConfig.defaults.io.alwaysUseProxy = false;

          // Query
          var query = new Query();
          query.returnGeometry = true;
          query.outSpatialReference = {
            "wkid": 102100
          };

          var currentClick = null;

          // Listen for map onClick event
          map.on("click", function(evt) {
            map.graphics.clear();
            map.infoWindow.hide();
            currentClick = query.geometry = evt.mapPoint;
            query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            queryTask.execute(query);
          });

          var districtFirstGraphic = null;
          // Listen for QueryTask onComplete event

          queryTask.on("complete", function(evt) {
            districtFirstGraphic = evt.featureSet.features[0];
            var symbol = new SimpleFillSymbol(SimpleFillSymbol.STYLE_SOLID, new SimpleLineSymbol(SimpleFillSymbol.STYLE_SOLID, new Color([100, 100, 100]), 3), new Color([255, 0, 0, 0.20]));
            districtFirstGraphic.setSymbol(symbol);

            map.graphics.add(districtFirstGraphic);
            map.setExtent(evt.featureSet.features[0].geometry.getExtent(), true);
            query.geometry = webMercatorUtils.webMercatorToGeographic(districtFirstGraphic.geometry);
            query.spatialRelationship = Query.SPATIAL_REL_INTERSECTS;
            queryTaskInterstates.execute(query);
          });

          // Listen for QueryTask executecomplete event
          queryTaskInterstates.on("complete", function(evt) {
            var fset = evt.featureSet;
            var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2);

            var resultFeatures = fset.features;
            for (var i = 0, il = resultFeatures.length; i < il; i++) {
              var graphic = resultFeatures[i];
              graphic.setSymbol(symbol);
              map.graphics.add(graphic);
            }
            
            queryTaskUSRoutes.execute(query);
          });
          
          queryTaskUSRoutes.on("complete", function(evt){
            var fset = evt.featureSet;
            var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2);

            var resultFeatures = fset.features;
            for (var i = 0, il = resultFeatures.length; i < il; i++) {
              var graphic = resultFeatures[i];
              graphic.setSymbol(symbol);
              map.graphics.add(graphic);
            }
            
            queryTaskLARoutes.execute(query);
          });
          
          queryTaskLARoutes.on("complete", function(evt){
            var fset = evt.featureSet;
            var symbol = new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID, new Color([0,0,0]), 2);

            var resultFeatures = fset.features;
            for (var i = 0, il = resultFeatures.length; i < il; i++) {
              var graphic = resultFeatures[i];
              graphic.setSymbol(symbol);
              map.graphics.add(graphic);
            }          
          });
      }


      function closeGraphic(){
          dijitPopup.close(dialog);
          map.graphics.clear();
      }
  })