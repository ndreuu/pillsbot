const {
    Context,
    Telegraf,
    Markup
} = require('telegraf')

require('dotenv').config()

const { Sequelize, DataTypes } = require('sequelize')

const cron = require('node-cron');

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

// const names = ['новопассит', 'ношпа']
const names = []
for (let i = 0; i < 256; i++) {
    names.push('btn_1' + `${i}`)
}

const map = {}

const state = {}

const Abra = sequelize.define('tundra', {
    id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
    chatId: { type: DataTypes.INTEGER, unique: true },
    name: { type: DataTypes.STRING },
    period: { type: DataTypes.INTEGER, defaultValue: -1 }
})

////////////////////////////
const Pills = sequelize.define('pills', {
    id: { type: DataTypes.INTEGER, primaryKey: true, unique: true, autoIncrement: true },
    by: { type: DataTypes.INTEGER },
    name: { type: DataTypes.STRING, defaultValue: '' },
    period: { type: DataTypes.INTEGER, defaultValue: -1 }
})
////////////////////////////


// const drawList = async (ctx) => {
//     try {
//         const buttons = names.map((name, index) => [
//             Markup.button.callback(name, 'btn_0' + `${index}`),
//             Markup.button.callback('🗑️', 'btn_1' + `${index}`)
//         ])
//         buttons.push([Markup.button.callback('🆕', 'new')])
//         await ctx.replyWithHTML('<b>Pill list:</b>', Markup.inlineKeyboard(
//             buttons
//         ))
//     } catch (e) {
//         console.error(e)
//     }
// }

const btns = new Array()

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

        if (state.name.length > 0) {
            buttons.push([Markup.button.callback('➕' + state.name, 'new')])
        }

        pills.forEach((pill, index) => map['btn_1' + `${index}`] = pill)
        // state.pillsBtns = pills.map((pill, index) => ({ name: pill.name, indx: index }) )

        await ctx.replyWithHTML('<b>Pill list:</b>', Markup.inlineKeyboard(buttons))
        // console.log(names)
    } catch (e) {
        console.log('AAAAAAAAAAAAAAA')
        console.error(e)
    }

    // pills.forEach((v) => console.log(v.name))
    // const user = await Abra.findOne({
    //     where: { chatId }
    // })
    // const label = `${user.period}`


    // if (user.period !== -1) {
    //     buttons.push([
    //         Markup.button.callback(label, '🔵'),
    //         Markup.button.callback('🗑️', '🗑️')
    //     ])
    // }

    // const buttons = names.map((name, index) => [
    //     Markup.button.callback(name, 'btn_0' + `${index}`),
    //     Markup.button.callback('🗑️', 'btn_1' + `${index}`)
    // ])


    ///////////////////////////////////////////
    // const personalPeriod = { period: user.name === 'Andrew' ? 10 : 5, name: user.name }
    // const period = '*/' + `${personalPeriod.period}` + ' * * * * *'
    ///////////////////////////////////////////
    // if (url_taskMap[personalPeriod.period] === undefined) {
    //     const task = cron.schedule(period, async () => {
    //         ctx.reply('Hey! ' + personalPeriod.name + ' ' + personalPeriod.period)
    //     });
    //     url_taskMap[user.period] = task
    //     console.log(user.period)
    //     task.start()
    // }
    ///////////////////////////////////////////
    ///////////////////////////////////////////




    // } catch (e) {
    //     console.error(e)
    // }
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
            console.log(state.chatId)
            console.log('state.chatIdstate.chatIdstate.chatId')

            try {
                await ctx.reply('Hey! ' + firstName + ' ' + chatId)
                console.log("--------->", chatId)
                console.log("--------->", firstName)

                const isNewUsr = async (chatId) => {
                    return await Abra.count({ where: { chatId: chatId } })
                        .then(count => {
                            console.log('Count===============>')
                            console.log(count)
                            return count === 0 ? true : false
                            // потому что по-другому не работает!
                        });
                }

                if (isNewUsr(chatId)) {
                    await Abra.create({ chatId: chatId, name: firstName })
                }

                // if (firstName === 'Andrew') {
                //     cron.schedule('*/10 * * * * *', async () => {
                //         await ctx.reply('Hey! ' + firstName + ' ' + chatId)
                //     });
                // }
            } catch (e) {
                console.error(e)
            }
        })

        bot.command('pills', drawList)


        // bot.on('message', (ctx) => {

        // })
        

        // if (state.pillsBtns) {
        //     state.pillsBtns.forEach((pill, index) => {
        //         bot.action('btn_1' + `${pill.indx}`, async (ctx) => {
        //             console.log('a')
        //             await ctx.answerCbQuery()
        //             console.log(state.chatId)
        //         })
        //         console.log(pill.name)
        //     })
        // }

        // bot.action('btn_1' + `${0}`, async (ctx) => {
        //     console.log('a')
        //     await ctx.answerCbQuery()
        //     console.log(state.chatId)
        // })

        // bot.use(async (ctx) => {
        //     const chatId = ctx.message?.chat.id || ctx.update.callback_query.from.id
        //     console.log('::::', chatId)
        //     state.chatId = chatId
        //     try {
        //         // bot.command('pills', drawList)




        //         // pills.forEach(async (pill, index) => {
        //         //     console.log(pill.name)
        //         //     bot.action('btn_1' + `${index}`, async (ctx) => {
        //         //         try {
        //         //             console.log(pill.name)
        //         //             await ctx.answerCbQuery()
        //         //             drawList(ctx)
        //         //         } catch (e) {
        //         //             console.error(e)
        //         //         }   
        //         //     })
        //         // })
        //     } catch (e) {
        //         console.error(e)
        //     }
        // })

        // bot.use('message', async (ctx, next) => {
        //     const chatId = ctx.message?.chat.id || ctx.update.callback_query.from.id

        //     console.log(':::', chatId)
        //     try {
        //         bot.command('pills', drawList)

        //         const pills = await Pills.findAll({
        //             where: { by: chatId }
        //         })

        //         pills.forEach(async (pill) => {
        //             bot.action('btn_1' + `${pill.id}`, async (ctx) => {
        //                 try {
        //                     console.log(pill.name)
        //                     await ctx.answerCbQuery()
        //                     drawList(ctx)
        //                 } catch (e) {
        //                     console.error(e)
        //                 }   
        //             })
        //         })
        //     } catch (e) {
        //         console.error(e)
        //     }
        //     // ctx.telegram.sendMessage(ctx.message.chat.id,
        //     //   "File content at: " + new Date() + " is: \n" + file
        //     // )
        // });
        


        // bot.action('period_10', async (ctx) => {
        //     try {
        //         const chatId = await ctx.update.callback_query.from.id
        //         await ctx.answerCbQuery()
        //         console.log('chatIdchatIdchatIdchatIdchatIdchatIdchatIdchatId')
        //         console.log(chatId)
        //         // await Abra.update({ period: 10 }, { where: { chatId } })
        //         drawList(ctx)
        //     } catch (e) {
        //         console.error(e)
        //     }
        // })


        // bot.action('period_20', async (ctx) => {
        //     try {
        //         const chatId = await ctx.update.callback_query.from.id
        //         await ctx.answerCbQuery()
        //         console.log('chatIdchatIdchatIdchatIdchatIdchatIdchatIdchatId')
        //         console.log(chatId)
        //         // await Abra.update({ period: 20 }, { where: { chatId } })
        //         drawList(ctx)
        //     } catch (e) {
        //         console.error(e)
        //     }
        // })


        bot.help(async (ctx) => await ctx.reply(text.commands))


        // bot.action('🗑️', async (ctx) => {
        //     const chatId = ctx.message?.chat.id || ctx.update.callback_query.from.id
        //     console.log('chatIdchatIdchatId', chatId)
        //     await ctx.answerCbQuery()
        //     try {
        //     await Abra.update({ period: -1 }, { where: { chatId: chatId } })
        //     } catch (e) {
        //         console.error(e)
        //     }
        //     url_taskMap.forEach(task => task.stop())
        //     await drawList(ctx)
        // })

        //         bot.action('🔵', async (ctx) => {
        //             const chatId = await ctx.message?.chat.id || ctx.update.callback_query.from.id
        //             const user = await Abra.findOne({ where: { chatId } })
        //             const period = '*/' + `${user.period}` + ' * * * * *'
        //             state.number = -1

        //             console.log(period)
        //             if (url_taskMap[user.period] === undefined) {
        //                 const task = cron.schedule(period, async () => {
        //                     ctx.reply('✔️ every ' + `${user.period}` + 'seconds')
        //                     console.log("Df")
        //                 });
        //                 url_taskMap[user.period] = task
        //                 console.log(user.period)
        //                 task.start()
        //             }                   
        // ///////////////////////////////////////////
        //             // const personalPeriod = { period: user.name === 'Andrew' ? 10 : 5, name: user.name }
        //             // const period = '*/' + `${personalPeriod.period}` + ' * * * * *'
        //             // /////////////////////////////////////////
        //             // if (url_taskMap[personalPeriod.period] === undefined) {
        //             //     const task = cron.schedule(period, async () => {
        //             //         ctx.reply('Hey! ' + personalPeriod.name + ' ' + personalPeriod.period)
        //             //     });
        //             //     url_taskMap[user.period] = task
        //             //     console.log(user.period)
        //             //     task.start()
        //             // }
        //             /////////////////////////////////////////
        // ///////////////////////////////////////////
        //         })




        // names.forEach(async (_, index) => {
        //     bot.action('btn_1' + `${index}`, async (ctx) => {
        //         try {
        //             rmName(names, index)
        //             await ctx.answerCbQuery()
        //             console.log(names)
        //             drawList(ctx)
        //         } catch (e) {
        //             console.error(e)
        //         }   
        //     })
        // })


        // bot.hears(/.[1-9]+/, ctx => {
        //     console.log(ctx.message.text)
        //     const text = ctx.message.text.substring(1)

        //     console.log(text)
        //     state.number = parseInt(text)
        //     // state.period = parseInt(text)

        //     drawList(ctx)
        // })


        bot.hears(/^\.[\s\S]*$/, ctx => {
            console.log(ctx.message.text)
            
            if (ctx.message.text.at(0) === '.') {
                const text = ctx.message.text.substring(1)

                console.log(text)
                state.name = text
            } else {
                state.name = ''
            }

            // state.number = parseInt(text)
            // state.period = parseInt(text)

            drawList(ctx)
        })

        ////Hears .name + draw

        bot.action('new', async (ctx) => {
            const chatId = ctx.message?.chat.id || ctx.update.callback_query.from.id
            const name = state.name
            state.name = ''
            const pillPeriod = -1
            try {
                await ctx.answerCbQuery()
                console.log('............', name)
                //Add in pills
                const isNewUsrPill = async () => {
                    return await Pills.count({ where: {  by: chatId, name: name } })
                        .then(count => {
                            console.log('CountPills===============>')
                            console.log(count)
                            return count === 0 ? true : false
                            // потому что по-другому не работает!
                        });
                }

                console.log('LLLLLLLLLLLLLLLLLLLLLLLLLLL,')
                console.log(await isNewUsrPill())


                if (await isNewUsrPill() === true && name.length > 0) {
                    console.log('LLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLLL')
                    console.log(await isNewUsrPill())
                    await Pills.create({
                        by: chatId,
                        name: name,
                        period: pillPeriod
                    })
                }


                // await Abra.update({ period: state.number }, { where: { chatId } })
                await drawList(ctx)
            } catch (e) {
                console.error(e)
            }
        })

        names.forEach(async (_, index) => {
            bot.action('btn_1' + `${index}`, async (ctx) => {
                const chatId = ctx.message?.chat.id || ctx.update.callback_query.from.id
                console.log('l')
                const pills = await Pills.findAll({ 
                    where: { 
                        by: chatId,
                        name: map['btn_1' + `${index}`].name,
                    } 
                })
                pills.forEach(async (pill) => await Pills.destroy({
                    where: {
                        id: pill.id
                    }
                }))
                // console.log(pills)
                // await Pills.destroy(pills)
                await drawList(ctx)  
                
            })
        })
        // btns.forEach( (btn) => {
            // console.log(btn)
            // bot.action('btn_10', async (ctx) => {
                // console.log("l")
                    // rmName(names, index)
                    // await ctx.answerCbQuery()
                    // console.log(names)
                    // await drawList(ctx)  
            // })
        // })


    } catch (e) {
        console.error('Failed connection to db', e)
    }
}



tst()


// buttons.push([Markup.button.callback('10', 'period_10')])
// buttons.push([Markup.button.callback('20', 'period_20')])

// const periods = []

const url_taskMap = [];



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
