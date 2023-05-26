/* eslint max-len: 0 */

const run = require('../helpers/run');

const tests = [
  {
    input: {
      file: require('../sampleData/media/sampleH264_1.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: true,
      preset: '--encoder svt_av1 -b 4000 -r 24 -E AAC -f mkv --no-optimize --width 1920 --height 1080 --crop 0:0:0:0',
      container: '.mkv',
      handBrakeMode: true,
      FFmpegMode: false,
      reQueueAfter: '',
      infoLog: 'File is being transcoded at 4000 Kbps to 1920x1080 as mkv\n',
    },
  },
  {
    input: {
      file: require('../sampleData/media/sampleH265_1.json'),
      librarySettings: {},
      inputs: {},
      otherArguments: {},
    },
    output: {
      processFile: false,
      preset: '',
      container: '.mkv',
      handBrakeMode: '',
      FFmpegMode: '',
      reQueueAfter: '',
      infoLog: 'File is already AV1\n',
    },
  },
];

tests.forEach((test, index) => {
  console.log(`Running test ${index + 1}`);
  const output = plugin(test.input.file, test.input.librarySettings, test.input.inputs, test.input.otherArguments);
  console.log('Output:');
  console.log(output);
  console.log('Expected Output:');
  console.log(test.output);
  console.log('\n');
});
