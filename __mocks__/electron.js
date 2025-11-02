const os = require('os');

module.exports = {
    app: {
        getPath: jest.fn((name) => {
            switch (name) {
                case 'userData':
                    return os.tmpdir();
                default:
                    return os.tmpdir();
            }
        })
    }
};