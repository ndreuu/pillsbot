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
    cronTime: { type: DataTypes.STRING, defaultValue: '' },
    comment: { type: DataTypes.STRING, defaultValue: '' },

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

        const pillsFiltered = []
        pills.reduce((acc, pill) => {
            if (!acc.has(pill.name)) {
                acc.set(pill.name, pill)
            }
            return acc
        }, new Map()).forEach((v) => pillsFiltered.push(v))

        pillsFiltered.forEach(v => console.log(v.name))

        const buttons = pillsFiltered.map((pill, index) => [
            Markup.button.callback(pill.name, 'btn_0' + `${index}`),
            Markup.button.callback('🗑️', 'btn_1' + `${index}`)
        ])

        if (state.name && state.name.length > 0) {
            buttons.push([Markup.button.callback('➕' + state.name, 'new')])
        }

        pillsFiltered.forEach((pill, index) => PILL_BY_BTN['btn_1' + `${index}`] = pill)
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

                pills.forEach(async (pill) => {
                    if (!url_taskMap.has(`${chatId}` + pill.name)) {
                        url_taskMap.set(`${chatId}` + pill.name, new Map())
                        const task = await cron.schedule(pill.cronTime, async () => {
                            ctx.replyWithHTML('<b>' + '✔️ ' + `${pill.name}` + ' ' + pill.comment ? pill.comment : '' + 'STR' + '</b>')
                            console.log("Notify: ", pill.name + ' ' + pill.comment)
                        });
                        url_taskMap.get(`${chatId}` + pill.name).set(pill.cronTime, task)
                        await url_taskMap.get(`${chatId}` + pill.name).get(pill.cronTime).start()
                    } else if (!url_taskMap.get(`${chatId}` + pill.name).has(pill.cronTime)) {
                        const task = await cron.schedule(pill.cronTime, async () => {
                            ctx.replyWithHTML('<b>' + '✔️ ' + `${pill.name}` + ' ' + pill.comment ? pill.comment : '' +  'STR' + '</b>')
                            console.log("Notify: ", pill.name + ' ' + pill.comment)
                        });
                        url_taskMap.get(`${chatId}` + pill.name).set(pill.cronTime, task)
                        await url_taskMap.get(`${chatId}` + pill.name).get(pill.cronTime).start()
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

                const nullify = parser => parser.map(() => null)

                const lessTwoDigits = Parser.sequenceOf([
                    Parser.digit,
                    Parser.possibly(Parser.digit)
                ])

                const name = Parser.sequenceOf([
                    nullify(Parser.char('.')),
                    Parser.many(Parser.anyCharExcept(Parser.char('\n')))
                ])

                const whiteSpaces = Parser.many(Parser.choice([
                    Parser.char('\r'),
                    Parser.char('\n'),
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
            const timesCron = []

            if (state.times) {
                state.times.forEach((time) => {
                    timesCron.push(`${time.minute}` + ' ' + `${time.hour}` + ' * * *')
                })
            }

            console.log(';;;;;;;;;;;', timesCron)
            console.log(';;;;;;;;;;;', state.times)

            state.name = null
            state.times = null
            state.comment = null

            try {
                const isNewUsrPill = async () => {
                    return await Pills.count({ where: { by: chatId, name: name } })
                        .then(count => {
                            return count === 0 ? true : false
                            // потому что по-другому не работает!
                        });
                }


                if (await isNewUsrPill() && name.length > 0) {
                    if (timesCron.length > 0) {
                        timesCron.forEach(async (time) => {
                            await Pills.create({
                                by: chatId,
                                name: name,
                                cronTime: time,
                                commnt: comment
                            })

                            const task = cron.schedule(time, async () => {
                                ctx.replyWithHTML('<b>' + '✔️ ' + `${name}` + ' ' + comment ? comment : '' + '</b>')
                                console.log("Notify: ", name + ' ' + comment)
                            });

                            if (!url_taskMap.has(`${chatId}` + name)) {
                                url_taskMap.set(`${chatId}` + name, new Map())
                                url_taskMap.get(`${chatId}` + name).set(time, task)
                                url_taskMap.get(`${chatId}` + name).get(time).start()
                            } else {
                                url_taskMap.get(`${chatId}` + name).set(time, task)
                                url_taskMap.get(`${chatId}` + name).get(time).start()
                            }
                        })
                    } else {
                        await Pills.create({
                            by: chatId,
                            name: name,
                            cronTime: 'Missing',
                            comment: comment
                        })
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
                    if (pill.cronTime !== 'Missing') {
                        await url_taskMap.get(`${chatId}` + pill.name).forEach((task) => task.stop())
                        await url_taskMap.delete(`${chatId}` + pill.name)
                    }

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

bot.launch()

// Enable graceful stop
process.once('SIGINT', () => bot.stop('SIGINT'))
process.once('SIGTERM', () => bot.stop('SIGTERM'))
