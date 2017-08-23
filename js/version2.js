  require(["esri/map", "esri/layers/FeatureLayer", "esri/symbols/SimpleFillSymbol",
  "esri/symbols/SimpleLineSymbol", "esri/renderers/SimpleRenderer", "esri/graphic",
  "esri/Color", "esri/lang", "esri/geometry/webMercatorUtils", "esri/tasks/query",
  "esri/tasks/QueryTask", "esri/dijit/HomeButton", "esri/dijit/Scalebar", "esri/InfoTemplate",
  "esri/config", "esri/dijit/Print", "esri/dijit/Legend", "esri/tasks/LegendLayer",
  "dojo/number", "dijit/popup", "dijit/TooltipDialog", "dojo/_base/array", "dojo/on", "dojo/dom",
  "dijit/layout/BorderContainer", "dijit/form/ComboBox", "dijit/form/Button",
  "dojo/store/Memory", "dojo/promise/all", "dojo/dom-style", "dojo/domReady!"], 
  function(Map, FeatureLayer, SimpleFillSymbol, SimpleLineSymbol, SimpleRenderer, Graphic,
  Color, esriLang, webMercatorUtils, Query, QueryTask, HomeButton, Scalebar, InfoTemplate, esriConfig, Print, Legend,
   LegendLayer, number, dijitPopup, TooltipDialog, arrayUtils, on, dom, Memory, all, domStyle){

      map = new Map("map",{
          basemap: "streets",
          center: [-92, 31],
          zoom: 7
      });

      var district = new FeatureLayer ("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/11",{
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

    //   var unselectedParishOutlines = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Live_Data/VDMS_FirstResponder/MapServer/8",{
    //       mode: FeatureLayer.MODE_SNAPSHOT,
    //       outFields: ["Name", "Population"]
    //   });

      var roadshowLinear1116 = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/4",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          infoTemplate: roadshowTemplate,
          outFields: ["*"]
      });

      var roadshowLinear1617 = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/5",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["*"]
      });

      var roadshowLinear1718 = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/6",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["*"]
      });

      var roadshowLinearOther = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/7",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["*"]
      });

      var roadshowPoint1116 = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/0",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["*"]
      });

      var roadshowPoint1617 = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/1",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["*"]
      });

      var roadshowPoint1718 = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/2",{
          mode: FeatureLayer.MODE_SNAPSHOT,
          outFields: ["*"]
      });

      var roadshowPointOther = new FeatureLayer("https://giswebnew.dotd.la.gov/arcgis/rest/services/Static_Data/2018_Roadshow/MapServer/3",{
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

    //   var unselectedSymbol = new SimpleFillSymbol(
    //       SimpleFillSymbol.STYLE_SOLID,
    //       new SimpleLineSymbol(SimpleLineSymbol.STYLE_SOLID,
    //       new Color([0,0,0,1]),3),
    //       new Color([125,125,125,0.75])
    //   );

      //Add the new renderers for the parishes and the state outline
      parishOutlines.setRenderer(new SimpleRenderer(parishSymbol));
      stateOutline.setRenderer(new SimpleRenderer(stateSymbol));
      //unselectedParishOutlines.setRenderer(new SimpleRenderer(unselectedSymbol));

      //Create a infoTemplate to provide user information when layer is clicked
      var roadshowTemplate = new InfoTemplate();
      roadshowTemplate.setTitle("Project Number: ${PROJECT}");
      roadshowTemplate.setContent("<b>Project Name: </b>${PROJECT_NAME}<br>");

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

      //Add a print button for the user
      var printer = new Print({
          map: map,
          url: "http://sampleserver6.arcgisonline.com/arcgis/rest/services/Utilities/PrintingTools/GPServer/Export%20Web%20Map%20Task",
          templates: [{
              label: "11x17 Landscape",
              format: "PDF",
              layout: "A3 Landscape",
          }, {
              label: "11x17 Portrait",
              format: "PDF",
              layout: "A3 Portrait"
          }, {
              label: "8.5x11 Landscape",
              format: "PDF",
              layout: "A4 Landscape"
          }, {
              label: "8.5x11 Portrait",
              format: "PDF",
              layout: "A4 Portrait"
          }]
      }, dom.byId("printButton"));
      printer.startup();

      //Add a legend to the map
      var legend = new Legend({
          map: map,
      }, "legendDiv");
      legend.startup();

      //Create a legend for the printing of the maps
      var legendLayer = new LegendLayer();
      legendLayer.layerId = parishOutlines.id;
      legendLayer.subLayerIds = [0];

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
          map.removeLayer(roadshowLinear1116);
          map.removeLayer(roadshowLinear1617);
          map.removeLayer(roadshowLinear1718);
          map.removeLayer(roadshowLinearOther);
          map.removeLayer(roadshowPoint1116);
          map.removeLayer(roadshowPoint1617);
          map.removeLayer(roadshowPoint1718);
          map.removeLayer(roadshowPointOther);
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
              //unselectedParishOutlines.setDefinitionExpression("Name <> '" + parishType + "'");
              parishOutline.setRenderer(renderer);
              //map.addLayer(unselectedParishOutlines);
              map.addLayer(parishOutline);
              var query = new Query();
              query.where = "Name = '" + parishType + "'";
              parishOutlines.queryFeatures(query, function(result){
                  map.setExtent(result.features[0].geometry.getExtent(), true);
              });

              //Add the roadshow features to the map starting with 2011-2016
              roadshowLinear1116.setDefinitionExpression("PARISH_NAME LIKE '%" + parishType + "%'");
              map.addLayer(roadshowLinear1116);

              //Letting dates of 2016-2017
              roadshowLinear1617.setDefinitionExpression("PARISH_NAME LIKE '%" + parishType + "%'");
              map.addLayer(roadshowLinear1617);

              //Letting dates of FY17-18
              roadshowLinear1718.setDefinitionExpression("PARISH_NAME LIKE '%" + parishType + "%'");
              map.addLayer(roadshowLinear1718);
              
              //Letting date of other
              roadshowLinearOther.setDefinitionExpression("PARISH_NAME LIKE '%" + parishType + "%'");
              map.addLayer(roadshowLinearOther);

              //Roadshow points 2011-2016
              roadshowPoint1116.setDefinitionExpression("PARISH_NAME LIKE '%" + parishType + "%'");
              map.addLayer(roadshowPoint1116);

              //Roadshow points 2016-17
              roadshowPoint1617.setDefinitionExpression("PARISH_NAME LIKE '%" + parishType + "%'");
              map.addLayer(roadshowPoint1617);

              //Roadshow points FY17-18
              roadshowPoint1718.setDefinitionExpression("PARISH_NAME LIKE '%" + parishType + "%'");
              map.addLayer(roadshowPoint1718);

              //Roadshow points other
              roadshowPointOther.setDefinitionExpression("PARISH_NAME LIKE '%" + parishType + "%'");
              map.addLayer(roadshowPointOther);
          }

          document.getElementById("resetFilter").onclick = function resetParishFilter(){
              map.removeLayer(parishOutline);
              map.removeLayer(roadshowLinear1116);
              map.removeLayer(roadshowLinear1617);
              map.removeLayer(roadshowLinear1718);
              map.removeLayer(roadshowLinearOther);
              map.removeLayer(roadshowPoint1116);
              map.removeLayer(roadshowPoint1617);
              map.removeLayer(roadshowPoint1718);
              map.removeLayer(roadshowPointOther);
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
          map.removeLayer(roadshowLinear1116);
          map.removeLayer(roadshowLinear1617);
          map.removeLayer(roadshowLinear1718);
          map.removeLayer(roadshowLinearOther);
          map.removeLayer(roadshowPoint1116);
          map.removeLayer(roadshowPoint1617);
          map.removeLayer(roadshowPoint1718);
          map.removeLayer(roadshowPointOther);
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

              //Add the roadshow features to the map starting with 2011-2016
              roadshowLinear1116.setDefinitionExpression("District = '" + districtType + "'");
              map.addLayer(roadshowLinear1116);

              //Letting dates of 2016-2017
              roadshowLinear1617.setDefinitionExpression("District = '" + districtType + "'");
              map.addLayer(roadshowLinear1617);

              //Letting dates of FY17-18
              roadshowLinear1718.setDefinitionExpression("District = '" + districtType + "'");
              map.addLayer(roadshowLinear1718);
              
              //Letting date of other
              roadshowLinearOther.setDefinitionExpression("District = '" + districtType + "'");
              map.addLayer(roadshowLinearOther);

              //Roadshow points 2011-2016
              roadshowPoint1116.setDefinitionExpression("District = '" + districtType + "'");
              map.addLayer(roadshowPoint1116);

              //Roadshow points 2016-17
              roadshowPoint1617.setDefinitionExpression("District = '" + districtType + "'");
              map.addLayer(roadshowPoint1617);

              //Roadshow points FY17-18
              roadshowPoint1718.setDefinitionExpression("District = '" + districtType + "'");
              map.addLayer(roadshowPoint1718);

              //Roadshow points other
              roadshowPointOther.setDefinitionExpression("District = '" + districtType + "'");
              map.addLayer(roadshowPointOther);
          }

          document.getElementById("resetDistrictFilter").onclick = function resetDistrictFilter(){
              map.removeLayer(districtOutline);
              map.removeLayer(roadshowLinear1116);
              map.removeLayer(roadshowLinear1617);
              map.removeLayer(roadshowLinear1718);
              map.removeLayer(roadshowLinearOther);
              map.removeLayer(roadshowPoint1116);
              map.removeLayer(roadshowPoint1617);
              map.removeLayer(roadshowPoint1718);
              map.removeLayer(roadshowPointOther);
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

              //Add the roadshow features to the map starting with 2011-2016
              roadshowLinear1116.setDefinitionExpression("House_District = '" + houseType + "'");
              map.addLayer(roadshowLinear1116);

              //Letting dates of 2016-2017
              roadshowLinear1617.setDefinitionExpression("House_District = '" + houseType + "'");
              map.addLayer(roadshowLinear1617);

              //Letting dates of FY17-18
              roadshowLinear1718.setDefinitionExpression("House_District = '" + houseType + "'");
              map.addLayer(roadshowLinear1718);
              
              //Letting date of other
              roadshowLinearOther.setDefinitionExpression("House_District = '" + houseType + "'");
              map.addLayer(roadshowLinearOther);

              //Roadshow points 2011-2016
              roadshowPoint1116.setDefinitionExpression("House_District = '" + houseType + "'");
              map.addLayer(roadshowPoint1116);

              //Roadshow points 2016-17
              roadshowPoint1617.setDefinitionExpression("House_District = '" + houseType + "'");
              map.addLayer(roadshowPoint1617);

              //Roadshow points FY17-18
              roadshowPoint1718.setDefinitionExpression("House_District = '" + houseType + "'");
              map.addLayer(roadshowPoint1718);

              //Roadshow points other
              roadshowPointOther.setDefinitionExpression("House_District = '" + houseType + "'");
              map.addLayer(roadshowPointOther);
          }

          document.getElementById("resetHouseFilter").onclick = function resetHouseFilter(){
              map.removeLayer(selectedHouse);
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
          }

          document.getElementById("resetSenateFilter").onclick = function resetSenateFilter(){
              map.removeLayer(selectedSenate);
          }
      }
   })