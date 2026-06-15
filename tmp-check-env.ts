import 'dotenv/config';
console.log('top JWT_SECRET =', process.env.JWT_SECRET);
import('./backend/controllers/authController.ts')
  .then(() => {
    console.log('authController imported');
    setTimeout(() => process.exit(0), 1000);
  })
  .catch(err => {
    console.error('authController import failed:', err);
    process.exit(1);
  });