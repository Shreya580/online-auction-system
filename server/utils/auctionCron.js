const cron = require('node-cron');
const Item = require('../models/Item');

const startAuctionCron = () => {
  cron.schedule('* * * * *', async () => {
    try {
      const expiredItems = await Item.find({
        isActive: true,
        endTime: { $lte: new Date() }
      });

      for (const item of expiredItems) {
        item.isActive = false;
        await item.save();
        console.log(`Auction closed for item: ${item.title}`);
      }
    } catch (error) {
      console.error('Cron error:', error.message);
    }
  });

  console.log('Auction cron job started');
};

module.exports = startAuctionCron;
