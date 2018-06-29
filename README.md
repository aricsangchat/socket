# Binance Trading Bot - Socket Bot

Socket Bot is connected to the web socket of the Binance and it is programmed to buy when the market dips and sell once those orders reach a set profit. You can customize the length of the dip that you wish to set Socket Bot and control how much profit you would like to see on orders. There are 3 tiers of dips that can be programmed and you can control the quantity of the order for each tier. For example, tier 1 set at 99% dip with a 1 qty order with a max order amount at 10, tier 2 set at 98% dip, 5 qty order with a max order amount at 5, and tier 3 set at 97% dip with a 10 qty order with a max order amount at 5. You can customize these settings to your style and there are two modes which have the same 3 tier settings so you can program aan aggressive and conservative settings modes.

### Run Locally

* clone repo
* npm i

* Create config.json file and add your Binance Api Key and Secret like so,
```
{
  "BINANCE_APIKEY": "api_key_goes_here",
  "BINANCE_APISECRET": "api_secret_goes_here"
}
```

* npm start
* go to localhost:3000
* use the bot commands to control the bot
