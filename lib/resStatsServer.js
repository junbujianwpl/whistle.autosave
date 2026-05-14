const { check: checkFilter, update: updateFilter } = require('./filter');
const {
  getRequestUrl,
  buildSessionFilePath,
  writeSessionFile,
} = require('./saveUtil');

module.exports = (server, { storage }) => {
  updateFilter(storage.getProperty('filterText'));
  server.on('request', (req) => {
    const active = storage.getProperty('active');
    if (!active) {
      return;
    }
    const dir = storage.getProperty('sessionsDir');
    if (!dir || typeof dir !== 'string') {
      return;
    }
    const filterUrl = getRequestUrl(req);
    if (!checkFilter(filterUrl)) {
      return;
    }
    req.getSession((s) => {
      if (!s) {
        return;
      }
      const filePath = buildSessionFilePath(dir, s);
      writeSessionFile(filePath, s);
    });
  });
};
