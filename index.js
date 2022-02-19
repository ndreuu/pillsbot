const {
    Telegraf,
    Markup
} = require('telegraf')

require('dotenv').config()

const { Sequelize, DataTypes } = require('sequelize')

const text = require('./const')

const bot = new Telegraf(process.env.BOT_TOKEN)

const sequelize = new Sequelize(
    // "d4ms0rdbf8h9kb", 
    // "dpmjuqvjvczawc", 
    // "6aac55dd6a6ce7c5fa568302963b97df4d8d20e501151ec46d09fb0c5d2c3933",
    {
        host: "ec2-18-203-64-130.eu-west-1.compute.amazonaws.com",
        database: "d4ms0rdbf8h9kb",
        username: "dpmjuqvjvczawc",
        port: 5432,
        password: "6aac55dd6a6ce7c5fa568302963b97df4d8d20e501151ec46d09fb0c5d2c3933",
        dialect: "postgres",
        dialectOptions: {
            ssl: {
                require: true,
                rejectUnauthorized: false
            }
        }
    });

// const TEST = sequelize.define('test', {
//     id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
//     chatId: { type: DataTypes.INTEGER, unique: true },

// })

const Abra = sequelize.define('undra', {
    id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
    chatId: { type: DataTypes.INTEGER, unique: true },
    name: { type: DataTypes.STRING }
})

const tst = async () => {
    try {
        await sequelize.authenticate()
        await sequelize.sync()
        console.log('DB connected')

        bot.command('test', async (ctx) => {
            const chatId = ctx.message.chat.id
            const user = await Abra.findOne({ 
                where: {
                    chatId: chatId, 
                    name: ctx.message.from.first_name     
                }
            })
            await ctx.reply(`${user.name}` + ' ' + `${user.chatId}`)
        })

        bot.command('Rips', async (ctx) => {
            await ctx.replyWithHTML('<b>Спасибо за минет 💜</b>')
        })

        bot.command('Artem', async (ctx) => {
            await ctx.replyWithHTML('<b>Артём — бычок,\nРваный башмачок,\nНа мусорке валяется,\nДа ещё ругается!\n\nРаунд</b>')
        })

        bot.start(async (ctx) => {
            const chatId = ctx.message.chat.id
            try {
                await ctx.reply('Hey! ' + ctx.message.from.first_name + ' ' + ctx.message.from.id)
                console.log("::::::::", chatId)
                await Abra.create({ chatId: chatId, name: ctx.message.from.first_name })
                // await Abra.commit
            } catch (e) {
                console.error(e)
            }
        })
        bot.help(async (ctx) => await ctx.reply(text.commands))

        bot.command('pills', drawList)

        names.forEach(async (_, index) => {
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

    } catch (e) {
        console.error('Failed connection to bd', e)
    }
}

tst()

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




bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
