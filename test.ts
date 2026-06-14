require('dotenv').config({path: '.env.local'});
const { getAllSitePages } = require('./src/features/home/actions.ts');
getAllSitePages().then((res: any) => console.log('Length:', res.length)).catch(console.error);
