const {
    Context,
    Telegraf,
    Markup
} = require('telegraf')
const { Sequelize, DataTypes, where } = require('sequelize')
const cron = require('node-cron');
const Parser = require('arcsecond')
const text = require('./const');
const { parse } = require('dotenv');
require('dotenv').config()

const EMPTY_GAP = [-1]

const bot = new Telegraf(process.env.BOT_TOKEN)


const sequelize = new Sequelize(
    {
        host: "ec2-63-32-248-14.eu-west-1.compute.amazonaws.com",
        database: "d5n734mokeck24",
        username: "hzhrtdqhxpqwld",
        port: 5432,
        password: "987cc5ba364ec550315f959d44aeb8b05a919d96196d874bd1b74e7726e53939",
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
        
        const comment = state.comment ? '\n' + state.comment : null
        const timesMsg = state.times
            ? state.times.reduce((acc, time) =>
                acc + time.hour + ' : ' + time.minute + '\n', '')
            : null
        const info = () => {
            if (!comment && !timesMsg) {
                return null
            }
            return (timesMsg ? timesMsg : '') + (comment ? comment : '')
        }
        console.log('AAAA...', timesMsg)
        await ctx.replyWithHTML('<b>Pill list:</b>', Markup.inlineKeyboard(buttons))
        if (info()) {
            await ctx.replyWithHTML(info())
        }
    } catch (e) {
        console.log('AAAAAAAAAAAAAAA')
        console.error(e)
    }
    state.screen = null


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
                console.log('>>>>>>>>>>>>>>>>>>>>>>>')
                console.log(pills[0].cronTime)
                if (pills[0].cronTime && pills[0].cronTime !== '' && pills[0].cronTime !== 'Missing') {
                    pills.forEach(async (pill) => {
                        if (!url_taskMap.has(`${chatId}` + pill.name)) {
                            url_taskMap.set(`${chatId}` + pill.name, new Map())
                            // url_taskMap.get(`${chatId}` + name).has(time)
                            const task = await cron.schedule(pill.cronTime, async () => {
                                ctx.replyWithHTML('<b>' + '✔️ ' + `${pill.name}` + '\n' + (pill.comment ? pill.comment : '') + '</b>')
                                // ctx.reply('✔️ ' + `${name}` + ' ' + comment)
                                //comment
                                console.log("Notify: ", pill.name + ' ' + pill.comment)
                            });
                            url_taskMap.get(`${chatId}` + pill.name).set(pill.cronTime, task)
                            await url_taskMap.get(`${chatId}` + pill.name).get(pill.cronTime).start()
                            // task.start()
                        } else if (!url_taskMap.get(`${chatId}` + pill.name).has(pill.cronTime)) {
                            const task = await cron.schedule(pill.cronTime, async () => {
                                ctx.replyWithHTML('<b>' + '✔️ ' + `${pill.name}` + '\n' + (pill.comment ? pill.comment : '') + '</b>')
                                // ctx.reply('✔️ ' + `${name}` + ' ' + comment)
                                //comment
                                console.log("Notify: ", pill.name + ' ' + pill.comment)
                            });
                            url_taskMap.get(`${chatId}` + pill.name).set(pill.cronTime, task)
                            await url_taskMap.get(`${chatId}` + pill.name).get(pill.cronTime).start()
                        }

                    })
                }

            } catch (e) {
                console.error(e)
            }

            await drawList(ctx)
        })

        bot.command('pills', (ctx) => drawList(ctx))

        bot.help(async (ctx) => await ctx.reply(text.commands))



        bot.hears(/^[\s\S]*$/, async (ctx) => {
            console.log(ctx.message.text)

            if (1 === 1) {
                const text = ctx.message.text
                const nullify = parser => parser.map(() => null)

                const lessTwoDigits = Parser.sequenceOf([
                    Parser.digit,
                    Parser.possibly(Parser.digit)
                ])

                const name = Parser.sequenceOf([
                    nullify(Parser.char('!')),
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

                    const _name = yield Parser.possibly(name);
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
                            name: _name ? _name[1].join('') : null,
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

            if (state.screen !== 'CHOOSEN') {

                if (state.name) {
                    drawList(ctx)
                }
            } else {
                if (state.comment || state.times) {
                    console.log('LAST FORM HERE')
                    console.log(state.times)
                    console.log(state.comment)
                    console.log(state.curPills)
                    //changing!
                    if (state.times) {
                        const chatId = ctx.message?.chat.id || ctx.update.callback_query.from.id

                        const newName = state.name ? state.name : state.curPills[0].name

                        const newComment = state.comment ? state.comment : state.curPills[0].comment

                        state.curPills.forEach(async (pill) => {
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

                        const timesCron = []
                        if (state.times) {
                            state.times.forEach((time) => {
                                timesCron.push(`${time.minute}` + ' ' + `${time.hour}` + ' * * *')
                            })
                        }

                        timesCron.forEach(async (time) => {
                            await Pills.create({
                                by: chatId,
                                name: newName,
                                cronTime: time,
                                comment: newComment
                                // period: pillPeriod
                            })

                            //*/10 * * * * * 40 19 * * *
                            const task = cron.schedule(time, async () => {
                                ctx.replyWithHTML('<b>' + '✔️ ' + `${newName}` + '\n' + (newComment ? newComment : '') + '</b>')
                                console.log("Notify: ", newName + ' ' + newComment)
                            });

                            if (!url_taskMap.has(`${chatId}` + newName)) {
                                url_taskMap.set(`${chatId}` + newName, new Map())
                                url_taskMap.get(`${chatId}` + newName).set(time, task)
                                await url_taskMap.get(`${chatId}` + newName).get(time).start()
                            } else {
                                url_taskMap.get(`${chatId}` + newName).set(time, task)
                                await url_taskMap.get(`${chatId}` + newName).get(time).start()
                            }
                        })


                    }
                    await state.curPills.forEach(async (pill) => {
                        await Pills.update(
                            { comment: state.comment },
                            { where: { id: pill.id } }
                        )
                        // Sequelize.handleResult(result)
                    })

                    const chatId = ctx.message?.chat.id || ctx.update.callback_query.from.id

                    const name = state.curPills[0].name
                    state.curPills = null


                    const t = await sequelize.transaction()

                    await t.commit()

                    const pills = await Pills.findAll({
                        where: {
                            by: chatId,
                            name: name,
                        }
                    })

                    console.log('>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>>||||')
                    console.log(pills)

                    // await drawList(ctx)

                    await drawTimes(pills, ctx)

                    state.curPills = null
                    state.times = null
                    state.comment = null
                    state.screen = null

                    await drawList(ctx)

                }
            }
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
                console.log('............', name)
                const isNewUsrPill = async () => {
                    return await Pills.count({ where: { by: chatId, name: name } })
                        .then(count => {
                            return count === 0 ? true : false
                            // потому что по-другому не работает!
                        });
                }

                if (await isNewUsrPill() && name.length > 0) {
                    //foreach timescron
                    if (timesCron.length > 0) {
                        timesCron.forEach(async (time) => {
                            await Pills.create({
                                by: chatId,
                                name: name,
                                cronTime: time,
                                comment: comment
                                // period: pillPeriod
                            })

                            //*/10 * * * * * 40 19 * * *
                            const task = cron.schedule(time, async () => {
                                ctx.replyWithHTML('<b>' + '✔️ ' + `${name}` + '\n' + (comment ? comment : '') + '</b>')
                                console.log("Notify: ", name + ' ' + comment)
                            });

                            if (!url_taskMap.has(`${chatId}` + name)) {
                                url_taskMap.set(`${chatId}` + name, new Map())
                                url_taskMap.get(`${chatId}` + name).set(time, task)
                                await url_taskMap.get(`${chatId}` + name).get(time).start()
                            } else {
                                url_taskMap.get(`${chatId}` + name).set(time, task)
                                await url_taskMap.get(`${chatId}` + name).get(time).start()
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

                console.log("urlurlurlurlurlurl")
                console.log(url_taskMap)
            })
        })

        const drawTimes = async (pills, ctx) => {
            if (pills) {
                console.log('pill.cronTimepill.cronTimepill.cronTimepill.cronTime')
                pills.forEach(v => console.log(v.comment))

                const times = pills.reduce((acc, pill) => acc + '\n' + pill.cronTime, '')

                const mystring = []
                times.split('\n').forEach((time) => {
                    const tmp = time.split(' ')
                    if (tmp !== undefined && tmp[1] !== undefined && tmp[0] !== undefined) {
                        mystring.push(tmp[1] + ' : ' + tmp[0] + (tmp[2] !== '*' ? ' :: ' + tmp[2] : ''))
                    }
                })

                await ctx.replyWithHTML(
                    '<b> ' + pills[0].name + ' </b>\n' +
                    (pills[0].comment ? pills[0].comment : '') + '\n\n' + mystring.join('\n')
                )
                state.curPills = pills
            }
        }

        NAMES.forEach(async (_, index) => {
            bot.action('btn_0' + `${index}`, async (ctx) => {
                const chatId = ctx.message?.chat.id || ctx.update.callback_query.from.id
                const pills = await Pills.findAll({
                    where: {
                        by: chatId,
                        name: PILL_BY_BTN['btn_1' + `${index}`].name,
                    }
                })
                drawTimes(pills, ctx)
                state.screen = 'CHOOSEN'
                await ctx.answerCbQuery()
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