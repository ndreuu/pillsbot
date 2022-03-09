const {
    Context,
    Telegraf,
    Markup
} = require('telegraf')
const { Sequelize, DataTypes } = require('sequelize')
const cron = require('node-cron');
const Parser = require('arcsecond')
const text = require('./const');
const { parse } = require('dotenv');
require('dotenv').config()

const EMPTY_GAP = [-1]

const bot = new Telegraf(process.env.BOT_TOKEN)

const sequelize = new Sequelize(
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

const NAMES = []

for (let i = 0; i < 256; i++) {
    NAMES.push('btn_1' + `${i}`)
}

const PILL_BY_BTN = {}

const state = {}

const Abra = sequelize.define('tundra', {
    id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
    chatId: { type: DataTypes.INTEGER, unique: true },
    name: { type: DataTypes.STRING },
    // period: { type: DataTypes.INTEGER, defaultValue: -1 }
})

const Pills = sequelize.define('pills', {
    id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
    by: { type: DataTypes.INTEGER },
    name: { type: DataTypes.STRING, defaultValue: '' },
    // period: { type: DataTypes.INTEGER, defaultValue: -1 }
    cronTime: { type: DataTypes.STRING, defaultValue: '' }
})


const drawList = async (ctx) => {
    // try {
    const chatId = await ctx.message?.chat.id || ctx.update.callback_query.from.id

    try {
        const pills = await Pills.findAll({
            where: { by: chatId }
        })
        pills.forEach((v) => console.log('>>>>> ', v.name))
        console.log(chatId)



        const buttons = pills.map((pill, index) => [
            Markup.button.callback(pill.name, 'btn_0' + `${index}`),
            Markup.button.callback('🗑️', 'btn_1' + `${index}`)
        ])

        if (state.name && state.name.length > 0) {
            buttons.push([Markup.button.callback('➕' + state.name, 'new')])
        }

        pills.forEach((pill, index) => PILL_BY_BTN['btn_1' + `${index}`] = pill)
        // state.pillsBtns = pills.map((pill, index) => ({ name: pill.name, indx: index }) )

        // const timesMsg = state.time 
        //     ? state.times.reduce((acc, time) => acc + time.hour + ' : ' + time.minute + '\n', '')
        //     : '' 
        const comment = state.comment ? '\n' + state.comment : null
        const timesMsg = state.times
            ? state.times.reduce((acc, time) =>
                acc + time.hour + ' : ' + time.minute + '\n', '')
            : null
        console.log('AAAA...', timesMsg)
        await ctx.replyWithHTML('<b>Pill list:</b>', Markup.inlineKeyboard(buttons))
        if (timesMsg) {
            await ctx.telegram.sendMessage(ctx.message.chat.id,
                timesMsg
            )
        }
        if (comment) {
            await ctx.telegram.sendMessage(ctx.message.chat.id,
                comment
            )
        }
        // console.log(names)
    } catch (e) {
        console.log('AAAAAAAAAAAAAAA')
        console.error(e)
    }


}

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
            await ctx.reply(`${user.name}`)
        })

        bot.command('Rips', async (ctx) => {
            await ctx.replyWithHTML('<b>Спасибо за минет 💜</b>')
        })

        bot.command('Artem', async (ctx) => {
            await ctx.replyWithHTML('<b>Артём — бычок,\nРваный башмачок,\nНа мусорке валяется,\nДа ещё ругается!\n\nРаунд</b>')
        })

        bot.start(async (ctx) => {
            const chatId = ctx.message.chat.id
            const firstName = ctx.message.from.first_name
            state.chatId = chatId

            try {
                await ctx.reply('Hey! ' + firstName + ' ' + chatId)
                console.log("--------->", chatId)
                console.log("--------->", firstName)

                const isNewUsr = async (chatId) => {
                    return await Abra.count({ where: { chatId: chatId } })
                        .then(count => {
                            return count === 0 ? true : false
                            // потому что по-другому не работает!
                        });
                }

                if (isNewUsr(chatId)) {
                    await Abra.create({ chatId: chatId, name: firstName })
                }
            } catch (e) {
                console.error(e)
            }

            try {
                const pills = await Pills.findAll({
                    where: {
                        by: chatId,
                    }
                })

                pills.forEach((pill) => {
                    // '*/10 * * * * *'
                    const task = cron.schedule('*/10 * * * * *', async () => {
                        ctx.reply('✔️ ' + `${pill.name}`)
                        console.log("Df")
                    });
                    // if (!url_taskMap[[chatId, pill.name]]) {
                    if (!url_taskMap.has(`${chatId}` + pill.name)) {
                        // url_taskMap[[chatId, pill.name]] = task
                        url_taskMap.set(`${chatId}` + pill.name, task)
                        task.start()
                    }
                })

            } catch (e) {
                console.error(e)
            }

            await drawList(ctx)
        })

        bot.command('pills', drawList)

        bot.help(async (ctx) => await ctx.reply(text.commands))

        bot.hears(/^[\s\S]*$/, ctx => {
            console.log(ctx.message.text)

            if (1 === 1) {
                const text = ctx.message.text
                // const text = ctx.message.text.substring(1)
                // const input = text.split('\n')
                // const name = input[0]
                // input.shift()
                // const periodsTxt = input.join('')
                // .filter((v, index) => v.at(0) === '.' && index !== 0)

                // if (periodsTxt) {
                const nullify = parser => parser.map(() => null)

                const lessTwoDigits = Parser.sequenceOf([
                    Parser.digit,
                    Parser.possibly(Parser.digit)
                ])

                const name = Parser.sequenceOf([
                    nullify(Parser.char('.')),
                    Parser.many(Parser.anyCharExcept(Parser.char('\n')))
                    // Parser.letters
                ])

                const whiteSpaces = Parser.many(Parser.choice([
                    // Parser.char(' '),
                    Parser.char('\r'),
                    Parser.char('\n'),
                    // Parser.char('\t'),
                ]))

                const hour = lessTwoDigits.map((v) => parseInt(v.join('')) < 24 ? (v.join('')) : null)

                const minute = lessTwoDigits.map((v) => parseInt(v.join('')) < 60 ? (v.join('')) : null)



                const _hour = Parser.possibly(
                    Parser.sequenceOf([
                        nullify(Parser.char('\n')),
                        nullify(whiteSpaces),
                        nullify(Parser.char('.')),
                        hour
                    ])
                )
                // .map(values => Array.of(values).filter(x => x !== null));
                // .map((v) => v.flat(Infinity).filter((v) => v !== null));


                const _minute = Parser.possibly(
                    Parser.sequenceOf([
                        nullify(whiteSpaces),
                        nullify(Parser.char('.')),
                        minute
                    ])
                )

                const msgParser = Parser.coroutine(function* () {
                    yield nullify(whiteSpaces);

                    const _name = yield name;
                    yield (
                        Parser.possibly(Parser.sequenceOf([
                            Parser.char('\n'),
                            nullify(whiteSpaces)
                        ]))
                    )

                    const times = yield Parser.possibly(Parser.sequenceOf([
                        nullify(Parser.char('.')),
                        (Parser.sepBy(Parser.sequenceOf([Parser.char('\n'), Parser.char('.')]))(
                            Parser.sequenceOf([
                                hour,
                                nullify(Parser.char('.')),
                                minute
                            ]),
                        ))
                    ]));

                    yield (Parser.possibly(Parser.sequenceOf([
                        Parser.char('\n'),
                        nullify(whiteSpaces)
                    ]))
                    )

                    const comment = yield (Parser.possibly(
                        Parser.sequenceOf([
                            nullify(Parser.char(':')),
                            Parser.many(Parser.anyCharExcept(Parser.char('\n')))
                        ])
                    ))

                    console.log('AAAAAAAAAAAAAAAAAAA')

                    console.log(comment)

                    yield Parser.mapData(data => {
                        const _times = times
                            ? times[1].reduce((acc, time) => {
                                acc.push({ hour: time[0], minute: time[2] })
                                return acc
                            }, [])
                            : null
                        const _comment = comment
                            ? comment[1].join('')
                            : null
                        console.log(_times)
                        return {
                            ...data,
                            name: _name[1].join(''),
                            times: _times,
                            comment: _comment
                        }
                    });

                    return comment;
                });

                const data = msgParser.run(text).data

                console.log(data)
                if (data) {
                    state.name = data.name
                    state.times = data.times
                    state.comment = data.comment
                }
            } else {
                state.name = null
                state.times = null
                state.comment = null
            }

            drawList(ctx)
        })

        bot.action('new', async (ctx) => {
            const chatId = ctx.message?.chat.id || ctx.update.callback_query.from.id
            const name = state.name
            const comment = state.comment ? '\n' + state.comment : null
            const times = state.times
            const timesCron = state.times
                ? state.times.reduce((acc, time) =>
                    //40 19 * * *
                    acc.push(`${time.minute}` + ' ' + `${time.hour}` + ' * * *'), [])
                : null

            state.name = null
            state.times = null
            state.comment = null

            const tst = new Map()
            const inside = new Map()
            inside.set('alex', 10)
            inside.set('john', 13)
            tst.set('xyn big', inside)
            console.log('>>>>>>>>TST', tst) 
            console.log('>>>>>>>>TST', tst.get('xyn big')) 
            tst.get('xyn big').forEach((v) =>
                console.log('>>>>>>>>TST', v))

            // console.log('>>>>>>>>TST', tst[['xyn','big']]['alex']) 
            // console.log('>>>>>>>>TST', tst[['xyn','big']])
            // tst[['xyn','big']].forEach(v => console.log(v)) 

            try {
                console.log('............', name)
                const isNewUsrPill = async () => {
                    return await Pills.count({ where: { by: chatId, name: name } })
                        .then(count => {
                            return count === 0 ? true : false
                            // потому что по-другому не работает!
                        });
                }

                if (await isNewUsrPill() && name.length > 0) {
                    await Pills.create({
                        by: chatId,
                        name: name,
                        // period: pillPeriod
                    })
                    //*/10 * * * * * 40 19 * * *
                    const task = cron.schedule('*/10 * * * * *', async () => {
                        ctx.reply('✔️ ' + `${name}`)
                        console.log("Notify: ", name)
                    });

                    // if (url_taskMap[[chatId, name]] === undefined) {
                    if (!url_taskMap.has(`${chatId}` + name)) {
                        url_taskMap.set(`${chatId}` + name, task)
                        task.start()
                    }
                }


                await ctx.answerCbQuery()
                await drawList(ctx)
            } catch (e) {
                console.error(e)
            }
        })

        NAMES.forEach(async (_, index) => {
            bot.action('btn_1' + `${index}`, async (ctx) => {
                const chatId = ctx.message?.chat.id || ctx.update.callback_query.from.id
                const pills = await Pills.findAll({
                    where: {
                        by: chatId,
                        name: PILL_BY_BTN['btn_1' + `${index}`].name,
                    }
                })

                pills.forEach(async (pill) => {
                    await url_taskMap.get(`${chatId}` + pill.name).stop()
                    // await url_taskMap[[chatId, pill.name]].stop()
                    await Pills.destroy({
                        where: {
                            id: pill.id
                        }
                    })
                })

                await ctx.answerCbQuery()

                await drawList(ctx)

            })
        })

    } catch (e) {
        console.error('Failed connection to db', e)
    }
}


tst()

const url_taskMap = new Map() 
// [];

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
