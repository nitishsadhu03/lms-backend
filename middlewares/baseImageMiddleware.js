
const validateBase64Image = (base64) => {
    const regex = /^data:image\/(png|jpeg|jpg|gif);base64,/;
    return regex.test(base64);
  };

  module.exports = { validateBase64Image };
  