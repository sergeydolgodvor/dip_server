const UploadController = require('../controllers/UploadController');
const UserController = require('../controllers/UserController');
const DocumentController = require('../controllers/DocumentController');
const auth = require('../middlewares/auth');
const authAdmin = require('../middlewares/authAdmin');
const uploadImage = require('../middlewares/uploadImage');

const createRoutes = (app) => {
  app.post('/user/register', UserController.register);
  app.post('/user/activation', UserController.activateEmail);
  app.post('/user/login', UserController.login);
  app.get('/user/logout', UserController.logout);
  app.post('/user/refresh_token', UserController.getAccessToken);

  app.post('/user/google_login', UserController.googleLogin);
  app.post('/user/facebook_login', UserController.facebookLogin);

  app.post('/user/forgot', UserController.forgotPassword);
  app.post('/user/reset', auth, UserController.resetPassword);

  app.get('/user/info', auth, UserController.getUserInfo);
  app.get(
    '/user/all_info',
    auth,
    authAdmin,
    UserController.getUsersAllInfo
  );

  app.patch('/user/update', auth, UserController.updateUser);
  app.post(
    '/api/upload_avatar',
    uploadImage,
    auth,
    UploadController.uploadAvatar
  );

  app.patch(
    '/user/update_role/:id',
    auth,
    authAdmin,
    UserController.updateUserRole
  );

  app.patch(
    '/user/edit_db/:id',
    auth,
    authAdmin,
    UserController.updateUserEditDB
  );

  app.patch(
    '/user/read_db/:id',
    auth,
    authAdmin,
    UserController.updateUserReadDB
  );

  app.delete(
    '/user/delete/:id',
    auth,
    authAdmin,
    UserController.deleteUser
  );

  // Documents
  app.post('/user/upload_document', DocumentController.uploadDocument);

  app.get('/api/get_all_document', DocumentController.getAllDocuments);

  app.post('/api/find_document', DocumentController.findDocument);

  app.delete(
    '/api/remove_document/:id',
    DocumentController.removeDocument
  );

  app.patch('/api/edit_document/:id', DocumentController.editDocument);
};

module.exports = createRoutes;
