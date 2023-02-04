const bcrypt = require('bcrypt');

module.exports = (newUser) => {
  bcrypt.genSalt(10, (err, salt) => {
    bcrypt.hash(newUser.password, salt, (err, hash) => {
      if (err) throw err;
      newUser.password = hash;
      try {
        newUser.save();
      } catch (error) {
        console.error(error);
      }
    });
  });
};

// module.exports = (password, ) => {
//   return new Promise((resolve, reject) => {
//     bcrypt.hash(password, 10, function (err, hash) {
//       if (err) return reject(err);

//       resolve(hash);
//     });
//   });
// };

// const hashPassword = async (password, saltRounds = 10) => {
//   try {
//       // Generate a salt
//       const salt = await bcrypt.genSalt(saltRounds);

//       // Hash password
//       return await bcrypt.hash(password, salt);
//   } catch (error) {
//       console.log(error);
//   }

//   // Return null if error
//   return null;
// };
