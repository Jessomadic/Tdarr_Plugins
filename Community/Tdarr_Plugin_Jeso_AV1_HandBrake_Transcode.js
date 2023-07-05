/* eslint no-plusplus: ["error", { "allowForLoopAfterthoughts": true }] */
/* eslint-disable no-restricted-globals */
const details = () => ({
  id: 'Tdarr_Plugin_Jeso_AV1_HandBrake_Transcode',
  Stage: 'Pre-processing',
  Name: 'AV1 HandBrake Transcoder',
  Type: 'Video',
  Operation: 'Transcode',
  Description: 'Transcodes to AV1 at the selected Bitrate. This is best used with Remux Files.',
  Version: '2.1.3',
  Tags: 'HandBrake,configurable',

  Inputs: [
    {
      name: 'BitRate',
      type: 'string',
      defaultValue: '4000',
      inputUI: {
        type: 'text',
      },
      tooltip: `
        ~ Requested Bitrate ~ \\n
        Put in the Bitrate you want to process to in Kbps. For example 4000Kbps is 4Mbps. `,

    },
    {
      name: 'ResolutionSelection',
      type: 'string',
      defaultValue: '1080p',
      inputUI: {
        type: 'dropdown',
        options: [
          '8KUHD',
          '4KUHD',
          '1080p',
          '720p',
          '480p',
        ],
      },
      // eslint-disable-next-line max-len
      tooltip: 'Any Resolution larger than this will become this Resolution same as the bitrate if the Res is lower than the selected it will use the res of the file as to not cause bloating of file size.',

    },
    {
      name: 'MaxResolution',
      type: 'string',
      defaultValue: '1080p',
      inputUI: {
        type: 'dropdown',
        options: [
          '8KUHD',
          '4KUHD',
          '1080p',
          '720p',
          '480p',
        ],
      },
      // eslint-disable-next-line max-len
      tooltip: 'Any Resolution smaller than this will be skipped.',

    },
    {
      name: 'Container',
      type: 'string',
      defaultValue: 'mkv',
      inputUI: {
        type: 'dropdown',
        options: [
          'mp4',
          'mkv',
        ],
      },
      tooltip: ` Container Type \\n\\n
          mkv or mp4.\\n`,
    },
    {
      name: 'AudioType',
      type: 'string',
      defaultValue: 'AAC',
      inputUI: {
        type: 'dropdown',
        options: [
          'AAC',
          'EAC3',
          'MP3',
          'Vorbis',
          'Flac16',
          'Flac24',
        ],
      },
      // eslint-disable-next-line max-len
      tooltip: 'Set Audio container type that you want to use',

    },
    {
      name: 'FrameRate',
      type: 'string',
      defaultValue: '24',
      inputUI: {
        type: 'text',
      },
      // eslint-disable-next-line max-len
      tooltip: 'If the files framerate is higher than 24 and you want to maintain that framerate you can do so here',

    },
  ],

});
const MediaInfo = {
  videoresolution:'',
  videoHeight: '',
  videoWidth: '',
  videoFPS: '',
  videoBR: '',
}; // var MediaInfo

// Easier for our functions if response has global scope.
const response = {
  processFile: false,
  preset: '',
  container: '',
  handBrakeMode: '',
  FFmpegMode: '',
  reQueueAfter: '',
  infoLog: '',
}; // var response

function getMediaInfo(file) {
  for (let i = 0; i < file.ffProbeData.streams.length; i++) {
    if (file.ffProbeData.streams[i].codec_type.toLowerCase() === 'video') {
//mediainfo.resolution needs to be calulated using MediaInfo.videoheight and MediaInfo.videowidth
      MediaInfo.videoresolution = file.ffProbeData.streams[i].height + 'x' + file.ffProbeData.streams[i].width;
      MediaInfo.videoHeight = Number(file.ffProbeData.streams[i].height);
      MediaInfo.videoWidth = Number(file.ffProbeData.streams[i].width);
      MediaInfo.videoFPS = Number(file.mediaInfo.track[i + 1].FrameRate) || 25;
      MediaInfo.videoBR = (MediaInfo.videoHeight * MediaInfo.videoWidth * MediaInfo.videoFPS * 0.08).toFixed(0);
      break; // Exit the loop once the first video stream is found
    }
  }
}

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs) => {
  // eslint-disable-next-line no-unused-vars
  const importFresh = require('import-fresh');
  // eslint-disable-next-line no-unused-vars
  const library = importFresh('../methods/library.js');
  // eslint-disable-next-line no-unused-vars
  const lib = require('../methods/lib')();


  const resolutionOrder = ['8KUHD', '4KUHD', '1080p', '720p', '480p'];

  const resolutionsdimensions = {
    '8KUHD': '--width 7680 --height 4320',
    '4KUHD': '--width 3840 --height 2160',
    '1080p': '--width 1920 --height 1080',
    '720p': '--width 1280 --height 720',
    '480p': '--width 640 --height 480',
  };
  
    //assign resolutionorder ratings based on what is bigger and smaller
    const resolutionOrderRating = {
      '8KUHD': 5,
      '4KUHD': 4,
      '1080p': 3,
      '720p': 2,
      '480p': 1,
    };

  const videoResolution = MediaInfo.videoresolution;
  const selectedResolution = inputs.ResolutionSelection;
  
 
  // make a variable for the dimensions
  const dimensions = resolutionsdimensions[selectedResolution]; 

  //Skip Transcoding if File is already AV1
  if (file.ffProbeData.streams[0].codec_name === 'av1') {
    response.processFile = false;
    response.infoLog += 'File is already AV1 \n';
    return response;
  }
  // eslint-disable-next-line no-constant-condition
  if ((true) || file.forceProcessing === true) {
    // eslint-disable-next-line max-len
    response.preset = `--encoder svt_av1 -b ${inputs.BitRate} -r ${inputs.FrameRate} -E ${inputs.AudioType} -f ${inputs.Container} --no-optimize ${dimensions} --crop 0:0:0:0`;
    response.container = `.${inputs.Container}`;
    response.handbrakeMode = true;
    response.ffmpegMode = false;
    response.processFile = true;
    response.infoLog += `File is being transcoded at ${inputs.BitRate} Kbps to ${dimensions} as ${inputs.Container} \n`;
    return response;
  }
  };
module.exports.details = details;
module.exports.plugin = plugin;
