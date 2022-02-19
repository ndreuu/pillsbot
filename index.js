const {
    Telegraf,
    Markup
} = require('telegraf')

require('dotenv').config()

const text = require('./const')

const bot = new Telegraf(process.env.BOT_TOKEN)

const names = ['новопассит', 'ношпа']

const drawList = async (ctx) => {
    try {
        const buttons = names.map((name, index) => [
            Markup.button.callback(name, 'btn_0' + `${index}`), 
            Markup.button.callback('🗑️', 'btn_1' + `${index}`)
        ])
        buttons.push([Markup.button.callback('🆕', 'new')])
        await ctx.replyWithHTML('<b>Pill list:</b>', Markup.inlineKeyboard(
            buttons
        ))
    } catch (e) {
        console.error(e)
    }
}

const rmName = (arr, i) => {
    let j = i - 1
    while (j > -1) {
        arr[i] = arr[j]
        i--
        j--
    }
    arr.shift()
  }

const addName = (arr, name) => {
  arr.push(name)
}

bot.command('Rips',async (ctx) => {
    await ctx.replyWithHTML('<b>Спасибо за минет 💜</b>')
})

bot.command('Artem', async (ctx) => {
    await ctx.replyWithHTML('<b>Артём — бычок,\nРваный башмачок,\nНа мусорке валяется,\nДа ещё ругается!\n\nРаунд</b>')
})

bot.start(async (ctx) => await ctx.reply('Hey!'))
bot.help(async (ctx) => await ctx.reply(text.commands))

bot.command('pills', drawList)

names.forEach((_, index) => {
    bot.action('btn_1' + `${index}`, async (ctx) => {
        try {
            await ctx.answerCbQuery()
            rmName(names, index)
            drawList(ctx)
        } catch (e) {
            console.error(e)
        }
    })
})

bot.action('new', async (ctx) => {
    try {
        await ctx.answerCbQuery()
        addName(names, `${'~'}`)
        drawList(ctx)
    } catch (e) {
        console.error(e)
    }
})

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
