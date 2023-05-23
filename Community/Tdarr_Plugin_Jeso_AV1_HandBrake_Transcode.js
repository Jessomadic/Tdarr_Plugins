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
  videoHeight: '',
  videoWidth: '',
  videoFPS: '',
  videoBR: '',
  videoBitDepth: '',
  overallBR: '',
  videoResolution: '',
}; // var MediaInfo

// Easier for our functions if response has global scope.
const response = {
  processFile: false,
  preset: '',
  container: '.mkv',
  handBrakeMode: true,
  FFmpegMode: false,
  reQueueAfter: true,
  infoLog: '',
}; // var response

// Finds the first video stream and populates some useful variables
function getMediaInfo(file) {
  let videoIdx = -1;

  for (let i = 0; i < file.ffProbeData.streams.length; i += 1) {
    const strstreamType = file.ffProbeData.streams[i].codec_type.toLowerCase();
    // Looking For Video
    // Check if stream is a video.
    if (videoIdx === -1 && strstreamType === 'video') {
      videoIdx = i;
      // get video streams resolution
      MediaInfo.videoResolution = `${file.ffProbeData.streams[i].height}x${file.ffProbeData.streams[i].width}`;
      MediaInfo.videoHeight = Number(file.ffProbeData.streams[i].height);
      MediaInfo.videoWidth = Number(file.ffProbeData.streams[i].width);
      MediaInfo.videoFPS = Number(file.mediaInfo.track[i + 1].FrameRate) || 25;
      // calulate bitrate from dimensions and fps of file
      MediaInfo.videoBR = (MediaInfo.videoHeight * MediaInfo.videoWidth * MediaInfo.videoFPS * 0.08).toFixed(0);
    }
  }
} // end  getMediaInfo()

// define resolution order from ResolutionSelection from biggest to smallest
const resolutionOrder = ['8KUHD', '4KUHD', '1080p', '720p', '480p'];

// define the width and height of each resolution from the resolution order
const resolutionsdimensions = {
  '8KUHD': '--width 7680 --height 4320',
  '4KUHD': '--width 3840 --height 2160',
  '1080p': '--width 1920 --height 1080',
  '720p': '--width 1280 --height 720',
  '480p': '--width 640 --height 480',
};

// eslint-disable-next-line no-unused-vars
const plugin = (file, librarySettings, inputs) => {
  // eslint-disable-next-line no-unused-vars
  const importFresh = require('import-fresh');
  // eslint-disable-next-line no-unused-vars
  const library = importFresh('../methods/library.js');
  // eslint-disable-next-line no-unused-vars
  const lib = require('../methods/lib')();

  // Get the selected resolution from the 'ResolutionSelection' variable
  const selectedResolution = inputs.ResolutionSelection;

  getMediaInfo(file);
  // use mediainfo to match height and width to a resolution on resolutiondimensions
  let dimensions = resolutionsdimensions[selectedResolution];
  // if the file is smaller than the selected resolution then use the file resolution
  if (MediaInfo.videoHeight < dimensions.split(' ')[3] || MediaInfo.videoWidth < dimensions.split(' ')[1]) {
    dimensions = `--width ${MediaInfo.videoWidth} --height ${MediaInfo.videoHeight}`;
    // eslint-disable-next-line brace-style
  }
  // read the bitrate of the video stream
  let videoBitRate = MediaInfo.videoBR;

  // if videoBitrate is over 1000000 devide by 100 to get the bitrate in Kbps
  if (videoBitRate > 1000000) {
    videoBitRate /= 100;
  } else { videoBitRate /= 1000; }
  // if VideoBitrate is smaller than selected bitrate then use the videoBitrate
  if (videoBitRate < inputs.BitRate) {
    // eslint-disable-next-line no-param-reassign
    inputs.BitRate = videoBitRate;
    // eslint-disable-next-line brace-style
  }
  // if VideoBitrate is larger than selected bitrate then use the selected bitrate
  else {
    // eslint-disable-next-line no-self-assign, no-param-reassign
    inputs.BitRate = inputs.BitRate;
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
  response.infoLog += 'File is being transcoded using custom arguments \n';
  return response;
};

module.exports.details = details;
module.exports.plugin = plugin;
