require('dotenv').config();
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
(async () => {
    console.log(await prisma.message.deleteMany());
})();
