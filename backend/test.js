const { uploadToImgBB } = require('./imageHandler');

describe('uploadImageTest', () => {
  it('should upload an image', async() => {
    // Test code here
    const imageBuffer = fs;
    const url = await uploadToImgBB(imageBuffer);
    console.log('Uploaded image:', url);

    // Assertion
    expect(url).to.be.a('string');
  });
});
