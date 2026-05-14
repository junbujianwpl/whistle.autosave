const path = require('path');
const fs = require('fs');

const INVALID_CHARS_RE = /[<>:"/\\|?*\x00-\x1f]/g;
const MAX_SEGMENT_LEN = 120;
const MAX_PATH_PARTS = 16;

const sanitize = (str) => {
  if (!str || typeof str !== 'string') {
    return '';
  }
  return str
    .replace(INVALID_CHARS_RE, '_')
    .replace(/\s+/g, '_')
    .replace(/_+/g, '_')
    .replace(/^\.+/, '')
    .slice(0, MAX_SEGMENT_LEN);
};

const getRequestUrl = (req) => {
  const oReq = (req && req.originalReq) || {};
  return oReq.realUrl || oReq.fullUrl || oReq.url || (req && req.fullUrl) || '';
};

const getSessionUrl = (session) => {
  if (!session) {
    return '';
  }
  if (session.url) {
    return session.url;
  }
  if (session.req && session.req.url) {
    return session.req.url;
  }
  return '';
};

const parseUrlParts = (url) => {
  const result = {
    host: 'unknown',
    pathParts: ['unknown'],
  };
  if (!url || typeof url !== 'string') {
    return result;
  }
  let parsed = url;
  if (!/^[a-z][a-z0-9+.-]*:\/\//i.test(parsed)) {
    parsed = `http://${parsed}`;
  }
  try {
    const u = new URL(parsed);
    result.host = sanitize(u.host.replace(/:/g, '_')) || 'unknown';
    result.pathParts = u.pathname
      .split('/')
      .filter(Boolean)
      .map(sanitize)
      .filter(Boolean);
    if (u.search) {
      const query = sanitize(u.search.replace(/^\?/, ''));
      if (query) {
        result.pathParts.push(query);
      }
    }
    if (!result.pathParts.length) {
      result.pathParts.push('root');
    }
    result.pathParts = result.pathParts.slice(0, MAX_PATH_PARTS);
    return result;
  } catch (e) {
    result.pathParts = [sanitize(url) || 'unknown'];
    return result;
  }
};

const formatDateDir = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
};

const formatTimePrefix = (date) => {
  const h = String(date.getHours()).padStart(2, '0');
  const min = String(date.getMinutes()).padStart(2, '0');
  const s = String(date.getSeconds()).padStart(2, '0');
  const ms = String(date.getMilliseconds()).padStart(3, '0');
  return `${h}${min}_${s}_${ms}`;
};

const buildSessionFilePath = (baseDir, session) => {
  const url = getSessionUrl(session);
  const { host, pathParts } = parseUrlParts(url);
  const method = sanitize((session.req && session.req.method) || 'GET') || 'GET';
  const statusCode = session.res && session.res.statusCode;
  const status = statusCode != null ? String(statusCode) : '0';
  const now = new Date();
  const dateDir = formatDateDir(now);
  const timePrefix = formatTimePrefix(now);
  const pathName = pathParts.join('_');
  const filename = `${timePrefix}_${host}_${method}_${status}_${pathName}.json`;
  return path.join(baseDir, dateDir, filename);
};

const resolveUniquePath = (filePath, cb) => {
  fs.access(filePath, fs.constants.F_OK, (err) => {
    if (err) {
      return cb(null, filePath);
    }
    const ext = path.extname(filePath);
    const base = filePath.slice(0, -ext.length);
    let seq = 2;
    const tryNext = () => {
      if (seq > 999) {
        return cb(new Error('Too many duplicate filenames'));
      }
      const candidate = `${base}~${seq}${ext}`;
      fs.access(candidate, fs.constants.F_OK, (accessErr) => {
        if (accessErr) {
          return cb(null, candidate);
        }
        seq += 1;
        tryNext();
      });
    };
    tryNext();
  });
};

const writeSessionFile = (filePath, session, cb) => {
  const text = JSON.stringify(session, null, '  ');
  const dir = path.dirname(filePath);
  fs.mkdir(dir, { recursive: true }, (err) => {
    if (err) {
      return cb && cb(err);
    }
    resolveUniquePath(filePath, (resolveErr, uniquePath) => {
      if (resolveErr) {
        return cb && cb(resolveErr);
      }
      fs.writeFile(uniquePath, text, (writeErr) => {
        if (writeErr) {
          fs.writeFile(uniquePath, text, cb || (() => {}));
          return;
        }
        cb && cb();
      });
    });
  });
};

module.exports = {
  getRequestUrl,
  getSessionUrl,
  buildSessionFilePath,
  writeSessionFile,
};
