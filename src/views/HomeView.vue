<template>
  <div class="main-layout">
    <div class="left-panel">
      <div class="counter">
        <span class="incident-numbers" v-text="accidentsAmount" />
        <h2>Current incidents</h2>
      </div>
      <div class="accidents">
        <div class="accidents-header" v-text="'Open incidents'" />
        <div v-for="(m, index) in allMarkers?.accidents?.features" class="accident-content" :key="index" @click="openDetails(m.attributes, 'accident')">
          <h6>{{ getIncident(m) }}</h6>
          {{ dayjs(m.attributes.opendate).format('DD MMM YYYY') }}
        </div>
      </div>
    </div>
    <div class="right-panel">
      <GMapMap
        class="map"
        :center="center"
        :zoom="14"
        map-type-id="terrain"
      >
        <template v-if="visibleLayers.accidents">
          <GMapMarker
            :key="index"
            v-for="(m, index) in allMarkers?.accidents?.features"
            :position="m.geometry"
            :clickable="true"
            @click="openDetails(m.attributes, 'accident')"
          />
        </template>
        <template v-if="visibleLayers.police">
          <GMapMarker
            :key="index"
            v-for="(m, index) in allMarkers?.police?.features"
            :position="m.geometry"
            :clickable="true"
            @click="openDetails(m.attributes, 'police')"
          />
        </template>
        <template v-if="visibleLayers.fire">
          <GMapMarker
            :key="index"
            v-for="(m, index) in allMarkers?.fire?.features"
            :position="m.geometry"
            :clickable="true"
            @click="openDetails(m.attributes, 'fire')"
          />
        </template>
        <template v-if="visibleLayers.emergencyFacilities">
          <GMapMarker
            :key="index"
            v-for="(m, index) in allMarkers?.emergencyFacilities?.features"
            :position="m.geometry"
            :clickable="true"
            @click="openDetails(m.attributes, 'emergencyFacilities')"
          />
        </template>
        <template v-if="visibleLayers.ambulances">
          <GMapMarker
            :key="index"
            v-for="(m, index) in allMarkers?.ambulances?.features"
            :position="m.geometry"
            :clickable="true"
            @click="openDetails(m.attributes, 'ambulances')"
          />
        </template>
        <div v-if="isDetailsVisible" class="details">
          <div class="details-container">
            <button type="button" class="close-details-btn" @click="closeDetails">
              <div class="close-details" />
            </button>
            <h3 v-text="details.header" />
            <div class="details-table-container">
            <div v-for="(detail, index) in details.details" class="details-table" :key="index">
              <div class="details-table-header" v-text="detail.header" />
              <div class="details-table-value" v-text="detail.value" />
            </div>
          </div>
        </div>
      </div>
      <button class="toggle-layers-btn" @click="showToggleLayers = !showToggleLayers">
        <img src="../assets/layers.png">
      </button>
      <div v-if="showToggleLayers" class="toggle-layers">
        <button
          type="button"
          class="toggle-btn"
          :style="visibleLayers.police ? 'background-color: lime;' : 'background-color: lightgray;'"
          @click="visibleLayers.police = !visibleLayers.police"
        >
          Police
        </button>
        <button
          type="button"
          class="toggle-btn"
          :style="visibleLayers.fire ? 'background-color: lime;' : 'background-color: lightgray;'"
          @click="visibleLayers.fire = !visibleLayers.fire"
        >
          Fire
        </button>
        <button
          type="button"
          class="toggle-btn"
          :style="visibleLayers.emergencyFacilities ? 'background-color: lime;' : 'background-color: lightgray;'"
          @click="visibleLayers.emergencyFacilities = !visibleLayers.emergencyFacilities"
        >
          Emergency Facilities
        </button>
        <button
          type="button"
          class="toggle-btn"
          :style="visibleLayers.ambulances ? 'background-color: lime;' : 'background-color: lightgray;'"
          @click="visibleLayers.ambulances = !visibleLayers.ambulances"
        >
          Ambulances
        </button>
        <button
          type="button"
          class="toggle-btn"
          :style="visibleLayers.accidents ? 'background-color: lime;' : 'background-color: lightgray;'"
          @click="visibleLayers.accidents = !visibleLayers.accidents"
        >
          Accidents
        </button>
      </div>
      </GMapMap>
      <div class="chart">
        <BarChart :chart-data="chartData" height="98" />
      </div>
    </div>
  </div>
</template>

<script>
// @ is an alias to /src
import { ref, reactive } from 'vue';
import axios from 'axios';
import proj4 from 'proj4';
import dayjs from 'dayjs';
import BarChart from '../components/BarChart.vue'

export default {
  name: 'HomeView',
  components: {
    BarChart,
  },
  setup() {
    const allMarkers = ref({});
    const isDetailsVisible = ref(false);
    const details = ref({});
    const accidentsAmount = ref(0);
    const currentAccidents = ref({});
    const showToggleLayers = ref(false);
    const visibleLayers = reactive({
      police: true,
      fire: true,
      emergencyFacilities: true,
      ambulances: true,
      accidents: true
    });

    const init = async () => {
      const police = await axios.get('https://services.arcgis.com/P3ePLMYs2RVChkJx/arcgis/rest/services/PoliceAGOL/FeatureServer/0/query?where=status+%3D+0+OR+status+%3D+1+OR+status+%3D+2&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=unitname%2C+status%2C+type%2C+callnumber%2C+speed%2C+lastreport&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=');
      const fire = await axios.get('https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/FireAGOL/FeatureServer/0/query?where=status+%3D+0+OR+status+%3D+1+OR+status+%3D+2&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=unitname%2C+status%2C+type%2C+speed%2C+lastreport&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=');
      const emergencyFacilities = await axios.get('https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/EmergencyFacilities/FeatureServer/0/query?where=capacity+%3E+0&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=pocname%2C+capacity%2C+pocemail%2C+pocname%2C+pocphone%2C+curcapacity%2C+daysoper%2C+facilityid%2C+factype%2C+hoursoper%2C+jurisdict%2C+opsstatus%2C+organiz&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=');
      const ambulances = await axios.get('https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/AmbulancesAGOL/FeatureServer/0/query?where=status+%3D+0+OR+status+%3D+1+OR+status+%3D+2&objectIds=&time=&geometry=&geometryType=esriGeometryEnvelope&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=unitname%2C+status%2C+type%2C+callnumber%2C+speed%2C+lastreport&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=');
      const accidents = await axios.get('https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/Dispatch/FeatureServer/0/query?where=opsstatus+%3D+%27Open%27&objectIds=&time=&geometry=&geometryType=esriGeometryPoint&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=incident%2C+synopsis%2C+opendate%2C+location&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=3&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=false&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token=');
      const accidentsAmountFetched = await axios.get('https://services.arcgis.com/P3ePLMYs2RVChkJx/ArcGIS/rest/services/Dispatch/FeatureServer/0/query?where=opsstatus+%3D+%27Open%27&objectIds=&time=&geometry=&geometryType=esriGeometryPoint&inSR=&spatialRel=esriSpatialRelIntersects&resultType=none&distance=0.0&units=esriSRUnit_Meter&returnGeodetic=false&outFields=opsstatus&returnGeometry=true&featureEncoding=esriDefault&multipatchOption=xyFootprint&maxAllowableOffset=&geometryPrecision=3&outSR=&defaultSR=&datumTransformation=&applyVCSProjection=false&returnIdsOnly=false&returnUniqueIdsOnly=false&returnCountOnly=true&returnExtentOnly=false&returnQueryGeometry=false&returnDistinctValues=false&cacheHint=false&orderByFields=&groupByFieldsForStatistics=&outStatistics=&having=&resultOffset=&resultRecordCount=&returnZ=false&returnM=false&returnExceededLimitFeatures=true&quantizationParameters=&sqlFormat=none&f=pjson&token='); 
      accidentsAmount.value = accidentsAmountFetched.data.count;
      convertGeometry(police.data.features);
      convertGeometry(fire.data.features);
      convertGeometryEmergency(emergencyFacilities.data.features);
      convertGeometry(ambulances.data.features);
      convertGeometry(accidents.data.features);
      allMarkers.value.police = police.data;
      allMarkers.value.fire = fire.data;
      allMarkers.value.emergencyFacilities = emergencyFacilities.data;
      allMarkers.value.ambulances = ambulances.data;
      allMarkers.value.accidents = accidents.data;
      countAccidents(allMarkers.value.accidents);
      fillData();
      console.log(allMarkers.value);

      setTimeout(() => {
        init();
      }, 61000);
    }

    const convertGeometry = arr => {
      arr.forEach(el => {
        const temp = proj4('EPSG:3857', 'EPSG:4326', el.geometry);
        el.geometry = {lat: temp.y, lng: temp.x};
      });
    }

    const convertGeometryEmergency = arr => {
      arr.forEach(el => {
        el.geometry = {lat: el.geometry.y, lng: el.geometry.x};
      });
    }

    const countAccidents = (acc) => {
      currentAccidents.value.battery = acc.features.filter(el => el.attributes.incident === 0).length;
      currentAccidents.value.pettyTheft = acc.features.filter(el => el.attributes.incident === 1).length;
      currentAccidents.value.disturbingThePeace = acc.features.filter(el => el.attributes.incident === 2).length;
      currentAccidents.value.cardiacEmergency = acc.features.filter(el => el.attributes.incident === 3).length;
      currentAccidents.value.respiratoryEmergency = acc.features.filter(el => el.attributes.incident === 4).length;
      currentAccidents.value.vehicleAccident = acc.features.filter(el => el.attributes.incident === 5).length;
    }

    init();

    const openDetails = (det, type) => {
      if (type === 'accident') {
        let incident = '';
        allMarkers.value.accidents.fields.forEach(el => {
          if(el.name === 'incident') {
            el.domain.codedValues.forEach(code => {
              if (code.code === det.incident) incident = code.name;
            })
          }
        });
        details.value = {
          header: incident,
          details: [
            {
              header: 'Location',
              value: det.location,
            },
            {
              header: 'Synopsis',
              value: det.synopsis,
            },
            {
              header: 'Open date',
              value: dayjs(det.opendate).format('DD MMM YYYY'),
            },
          ],
        };
      } else if (type === 'ambulances') {
        let status = '';
        let type = '';
        allMarkers.value.ambulances.fields.forEach(el => {
          if(el.name === 'status') {
            el.domain.codedValues.forEach(code => {
              if (code.code === det.status) status = code.name;
            })
          }
          if(el.name === 'type') {
            el.domain.codedValues.forEach(code => {
              if (code.code === det.type) type = code.name;
            })
          }
        });
        details.value = {
          header: `Ambulances: ${det.unitname}`,
          details: [
            {
              header: 'Unit',
              value: det.unitname,
            },
            {
              header: 'Status',
              value: status,
            },
            {
              header: 'Type',
              value: type,
            },
            {
              header: 'Call number',
              value: det.callnumber,
            },
            {
              header: 'Speed',
              value: det.speed.toFixed(2),
            },
            {
              header: 'Last report',
              value: dayjs(det.lastreport).format('DD MMM YYYY'),
            },
          ],
        };
      } else if (type === 'police') {
        let status = '';
        let type = '';
        allMarkers.value.police.fields.forEach(el => {
          if(el.name === 'status') {
            el.domain.codedValues.forEach(code => {
              if (code.code === det.status) status = code.name;
            })
          }
          if(el.name === 'type') {
            el.domain.codedValues.forEach(code => {
              if (code.code === det.type) type = code.name;
            })
          }
        });
        details.value = {
          header: `Police: ${det.unitname}`,
          details: [
            {
              header: 'Unit',
              value: det.unitname,
            },
            {
              header: 'Status',
              value: status,
            },
            {
              header: 'Type',
              value: type,
            },
            {
              header: 'Call number',
              value: det.callnumber,
            },
            {
              header: 'Speed',
              value: det.speed.toFixed(2),
            },
            {
              header: 'Last report',
              value: dayjs(det.lastreport).format('DD MMM YYYY'),
            },
          ],
        };
      } else if (type === 'fire') {
                let status = '';
        let type = '';
        allMarkers.value.fire.fields.forEach(el => {
          if(el.name === 'status') {
            el.domain.codedValues.forEach(code => {
              if (code.code === det.status) status = code.name;
            })
          }
          if(el.name === 'type') {
            el.domain.codedValues.forEach(code => {
              if (code.code === det.type) type = code.name;
            })
          }
        });
        details.value = {
          header: `Fire: ${det.unitname}`,
          details: [
            {
              header: 'Unit',
              value: det.unitname,
            },
            {
              header: 'Status',
              value: status,
            },
            {
              header: 'Type',
              value: type,
            },
            {
              header: 'Speed',
              value: det.speed.toFixed(2),
            },
            {
              header: 'Last report',
              value: dayjs(det.lastreport).format('DD MMM YYYY'),
            },
          ],
        };
      } else if (type === 'emergencyFacilities') {
        let factype = '';
        allMarkers.value.emergencyFacilities.fields.forEach(el => {
          if(el.name === 'factype') {
            el.domain.codedValues.forEach(code => {
              if (code.code === det.factype) factype = code.name;
            })
          }
        });
        details.value = {
          header: `Emergency Facilities: ${det.organiz}`,
          details: [
            {
              header: 'Name',
              value: det.pocname,
            },
            {
              header: 'Capacity',
              value: det.capacity,
            },
            {
              header: 'Contact Email',
              value: det.pocemail,
            },
            {
              header: 'Contact Name',
              value: det.pocname,
            },
            {
              header: 'Contact Phone',
              value: det.pocphone,
            },
            {
              header: 'Current capacity',
              value: det.curcapacity,
            },
            {
              header: 'Days operation',
              value: det.daysoper,
            },
            {
              header: 'Emergency Facility ID',
              value: det.facilityid,
            },
            {
              header: 'Feature Type',
              value: factype,
            },
            {
              header: 'Hours operation',
              value: det.hoursoper,
            },
            {
              header: 'Jurisiction',
              value: det.jurisdict,
            },
            {
              header: 'Operational status',
              value: det.opsstatus,
            },
          ],
        };
      }
      isDetailsVisible.value = true;
    }

    const closeDetails = () => {
      isDetailsVisible.value = false;
      details.value = {};
    }

    const getIncident = (val) => {
      let incident = '';
      allMarkers.value.accidents.fields.forEach(el => {
        if(el.name === 'incident') {
          el.domain.codedValues.forEach(code => {
            if (code.code === val.attributes.incident) incident = code.name;
          })
        }
      });
      return incident;
    }

    const chartData = ref({
      datasets: []
    });

    const fillData = () => {
      const updatedChartData = {
        labels: [
          'Battery',
          'Petty Theft',
          'Disturbing the Peace',
          'Cardiac Emergency',
          'Respiratory Emergency',
          'Vehicle Accident'
        ],
        datasets: [
          {
            label: [
              'incident'
            ],
            backgroundColor: ['#F9FF33', '#FC1E08', '#29FC08', '#08FCE6', '#E208FC', '#FC08A3'],
            data: [
              currentAccidents.value.battery,
              currentAccidents.value.pettyTheft,
              currentAccidents.value.disturbingThePeace,
              currentAccidents.value.cardiacEmergency,
              currentAccidents.value.respiratoryEmergency,
              currentAccidents.value.vehicleAccident,
            ]
          }
        ]
      }

      chartData.value = { ...updatedChartData };
    }

    return {
      center: ref({ lat: 34.055569, lng: -117.192541 }),
      allMarkers,
      openDetails,
      closeDetails,
      isDetailsVisible,
      details,
      accidentsAmount,
      getIncident,
      dayjs,
      chartData,
      visibleLayers,
      showToggleLayers,
      console
    };
  }
}
</script>
<style lang="scss" scoped>
.main-layout {
  display: flex;
}

.left-panel {
  width: 40%;
}

.right-panel {
  width: 60%;
}

.map {
  width: 100%;
  height: 70vh;
  position: relative;
  border: 10px solid rgb(61, 148, 138);
  border-left: none;
  box-sizing: border-box;
}

.details {
  position: absolute;
  width: 35%;
  max-height: 300px;
  overflow: auto;
  top: 20px;
  left: 20px;
  padding: 10px;
  background-color: white;
  box-shadow: 0 0 20px 2px;
}

.close-details-btn {
  position: absolute;
  top: 0;
  right: 0;
  border: none;
  background-color: transparent;
  padding: 0;
}

.close-details {
  position: relative;
  padding: 10px;
  cursor: pointer;

  &::after {
    position: absolute;
    content: '';
    background-color: black;
    top: 4px;
    left: 8px;
    height: 12px;
    width: 2px;
    transform: rotate(45deg);
  }

  &::before{
    position: absolute;
    content: '';
    background-color: black;
    top: 4px;
    left: 8px;
    height: 12px;
    width: 2px;
    transform: rotate(-45deg);
  }
}

.details-container {
  position: relative;
  padding: 15px 10px;
}

h3 {
  font-size: 20px;
  font-weight: 700;
}

.details-table-container {
  margin-top: 15px;
  border: 1px solid black;
  border-bottom: none;
}

.details-table {
  display: flex;
  border-bottom: 1px solid black;

  &-header {
    width: 40%;
    padding: 4px 8px;
    box-sizing: border-box;
    overflow: hidden;
    overflow-wrap: break-word;
    background-color: lightgray;
  }

  &-value {
    width: 60%;
    padding: 4px 8px;
    overflow: hidden;
    overflow-wrap: break-word;
    box-sizing: border-box;
  }
}

.chart {
  position: relative;
  width: 100%;
  height: 30vh;
  border: 10px solid rgb(61, 148, 138);
  border-left: none;
  border-top: none;
  box-sizing: border-box;
}

.counter {
  display: flex;
  flex-flow: column;
  align-items: center;
  justify-content: center;
  height: 50vh;
  border: 10px solid rgb(61, 148, 138);
  box-sizing: border-box;
}

.accidents {
  position: relative;
  height: 50vh;
  border: 10px solid rgb(61, 148, 138);
  border-top: none;
  box-sizing: border-box;
  overflow: auto;
}

.accidents-header {
  position: sticky;
  top: 0;
  left: 0;
  background-color: white;
  padding: 8px 8px;
}

.accident-content {
  padding: 8px 16px;
  border-bottom: 1px solid black;
  cursor: pointer;
}

.incident-numbers {
  font-size: 160px;
  padding-bottom: 40px;
  color: rgb(61, 148, 138);
}

h2 {
  font-size: 48px;
}

h6 {
  font-size: 16px;
  padding-bottom: 4px;
  font-weight: 700;
}

.toggle-layers-btn {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 8px 8px;
  position: absolute;
  right: 58px;
  top: 10px;
  border: none;
  background-color: white;
  cursor: pointer;
}

.toggle-layers {
  display: flex;
  flex-flow: column;
  padding: 10px;
  position: absolute;
  right: 58px;
  top: 50px;
  background-color: white;
}

.toggle-btn {
  border: none;
  background-color: transparent;
  padding: 4px 8px;
  margin: 2px 0;
  cursor: pointer;
}
</style>
