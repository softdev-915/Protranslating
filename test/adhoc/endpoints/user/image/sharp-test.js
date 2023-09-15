const sharp = require('sharp');

const cropData = {
  height: 721,
  left: 0,
  top: 478,
  width: 721,
};

sharp('/Users/javierlecuona/Pictures/ele-lion.jpeg')
// FIXME cropData has not the proper format to call resize
.extract(cropData)
.resize(200, 200)
.min() // .max()
.toFile('/Users/javierlecuona/Pictures/ele-lion_1.jpeg')
.then(() => {
  process.exit(0);
});
