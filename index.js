import schedule from 'node-schedule'
import fetch from 'node-fetch'
import crypto from 'crypto';
import { getWorkdaysForThisYear, isTodayWorkday, scheduleNextYearFetch } from './holidays.js';
import { logError, logInfo } from './logger.js';
import fs from 'fs/promises';

async function getReminderConfig() {
  try {
    const data = await fs.readFile('./reminderConfig.json', 'utf8');
    return JSON.parse(data);
  } catch (error) {
    logError(error, 'Error reading reminderConfig.json');
    // 如果读取失败，使用默认配置
    return {
      workHours: [
        { start: 9, end: 11 }, // 上午
        { start: 15, end: 18 }, // 下午
      ],
    };
  }
}

// 生成喝水提醒任务
async function generateWaterReminders() {
  const reminders = [];
  const config = await getReminderConfig();
  const { workHours } = config;

  for (const period of workHours) {
    for (let hour = period.start; hour <= period.end; hour++) {
      for (let minute of [0, 30]) {
        const time = { hour, minute };
        if (shouldSkipReminder(time)) {
          continue;
        }
        reminders.push({
          time: { hour, minute },
          title: "【喝水提醒】",
          needWeather: true
        });
      }
    }
  }
  return reminders;
}

// 定义所有提醒任务
const reminderTasks = [
  ...generateWaterReminders(),
  {
    time: { hour: 9, minute: 0 },
    title: "【上班时间到】9:00 牛马模式启动！",
    text: "#### 【上班时间到】9:00 牛马模式启动！  \n > ##### {workStartTip}  \n > ##### 新的一天，新的痛苦，加油打工人！\n > ##### {time}"
  },
  {
    time: { hour: 10, minute: 45 },
    title: "【午餐预警】10:45 点外卖时间到！",
    text: "#### 【午餐预警】10:45 点外卖时间到！  \n > ##### 打工人的午餐续命时刻到啦！\n > ##### 别饿着自己，点外卖冲鸭！\n > ##### {time}"
  },
  {
    time: { hour: 11, minute: 55 },
    title: "【开饭啦】11:55 外卖取餐提醒",
    text: "#### 【开饭啦】11:55 外卖取餐提醒  \n > ##### 外卖已到，摸鱼时间结束，开饭啦！\n > ##### 别让美食等太久哦~\n > ##### {time}"
  },
  {
    time: { hour: 14, minute: 0 },
    title: "【下午上班提醒】14:00 牛马模式继续！",
    text: "#### 【下午上班提醒】14:00 牛马模式继续！  \n > ##### {afternoonWorkStartTip}  \n > ##### 下午也要元气满满哦，加油打工人！\n > ##### {time}"
  },
  {
    time: { hour: 18, minute: 45 },
    title: "【下班倒计时】18:45 准备跑路！",
    text: "#### 【下班倒计时】18:45 准备跑路！  \n > ##### 今日份社畜营业已完成！\n > ##### 溜了溜了，别让工位看见你下班的背影！\n > ##### {time}"
  }
];

// 喝水提示语数组
const waterTips = [
  "打工人，喝水续命，别让老板看到你渴晕在工位上！",
  "多喝热水，少熬夜，工资不会多但身体会垮！",
  "水是免费的，健康无价，起来灌一杯！",
  "别只会敲代码，偶尔也敲敲水杯！",
  "喝水时间到，别让肾脏加班！",
  "摸鱼要低调，喝水要高调！",
  "喝水是打工人的自我修养！",
  "再不喝水，老板都要心疼你了！"
];

// 上班时间提示语数组
const workStartTips = [
  "社畜模式已启动！今天又是为老板打工的一天！",
  "上班时间到！收起你的摸鱼技能，开始表演！",
  "打工人，打工魂！9点到了，该去工位续命了！",
  "上班铃响了！别让老板发现你还在床上！",
  "新的一天，新的痛苦！上班时间到，准备接受现实的毒打！",
  "9点整！该去工位打卡了，不然工资要扣了！",
  "上班时间到！收起你的emo，开始今天的社畜表演！",
  "打工人起床了！9点不打卡，老板要发飙了！",
  "上班时间到！别让工位等太久，它也想你了！",
  "9点整！该去工位续命了，不然今天又要饿肚子！"
];

// 下午上班时间提示语数组
const afternoonWorkStartTips = [
  "下午牛马模式重启！午休结束，继续搬砖！",
  "下午上班时间到！睡醒了吗？该起来搬砖了！",
  "下午2点整，社畜续命时间到！",
  "午休结束，打工人该回去被老板毒打了！",
  "下午场开始营业了！打工人，冲鸭！",
  "下午的工作在召唤你！别再摸鱼了！",
  "下午上班时间到！咖啡续命，社畜重启！",
  "下午2点，牛马模式加载完成，开始工作！",
  "午休结束，打工人的下午场开始了！",
  "下午上班时间到！记得泡杯咖啡续命哦！"
];

function getRandomTip(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// 统一的任务处理函数
async function handleTasks() {
  try {
    const workdays = await workdaysPromise;
    var isWorkday = isTodayWorkday(workdays);
    logInfo(`Today is ${isWorkday ? 'a workday' : 'a weekend'}`);
    if (!isWorkday) return;

    const now = new Date();
    const currentHour = now.getHours();
    const currentMinute = now.getMinutes();
    logInfo(`Current time: ${currentHour}:${currentMinute}`);
    const currentTasks = getTasksToRun({ hour: currentHour, minute: currentMinute }, reminderTasks);

    for (const task of currentTasks) {
      await processTask(task);
    }
  } catch (error) {
    logError(error, 'Error in handleTasks function');
  }
}

function getTasksToRun(currentTime, tasks) {
  const { hour, minute } = currentTime;
  return tasks.filter(task => task.time.hour === hour && task.time.minute === minute);
}

async function processTask(task) {
  try {
    if (task.needWeather) {
      await sendWeatherReminder();
    } else {
      let messageText = task.text.replace('{time}', new Date().toLocaleTimeString());

      // 如果是上班时间提示，替换随机提示语
      if (task.time.hour === 9 && task.time.minute === 0) {
        messageText = messageText.replace('{workStartTip}', getRandomTip(workStartTips));
      }

      // 如果是下午上班时间提示，替换随机提示语
      if (task.time.hour === 14 && task.time.minute === 0) {
        messageText = messageText.replace('{afternoonWorkStartTip}', getRandomTip(afternoonWorkStartTips));
      }

      await sendDingTalkMsg(messageText, task.title);
    }
  } catch (error) {
    logError(error, 'Error processing task');
  }
}

// 统一的天气提醒函数（使用喝水机器人）
async function sendWeatherReminder() {
  try {
    let districtId = process.env.BAIDU_DISTRICT_ID || '440304'
    let ak = process.env.BAIDU_AK
    if (!ak) {
      throw new Error('BAIDU_AK environment variable is required')
    }
    let bdurl = `https://api.map.baidu.com/weather/v1/?district_id=${districtId}&data_type=all&ak=${ak}`

    let res = await fetch(bdurl)
    let data = await res.json()

    const city = data.result.location.city;
    const district = data.result.location.name;
    const weather = data.result.now.text;
    const temp = data.result.now.temp;
    const feels = data.result.now.feels_like;
    const wind = data.result.now.wind_dir + data.result.now.wind_class;
    const aqi = data.result.now.aqi;
    const pm25 = data.result.now.pm25;

    const title = `【喝水提醒】${city}${district} ${weather} ${temp}℃`;
    const text = `#### 【喝水提醒】${city}${district} ${weather} ${temp}℃  \n > #####  天气：${weather}  \n > ##### 温度：${temp}℃ (体感${feels}℃)  \n > ##### 风力：${wind}  \n > ##### 空气质量：${aqi} (PM2.5: ${pm25})  \n > #####  ${getRandomTip(waterTips)}  \n > ##### ${new Date().toLocaleTimeString()}发布 [天气](https://www.dingtalk.com)`;

    await sendDingTalkMsg(text, title, { bot: 'water' });
  } catch (error) {
    logError(error, 'Error in sendWeatherReminder function');
    throw error;
  }
}

function resolveDingTalkCredentials(bot = 'default') {
  if (bot === 'water' && process.env.DINGTALK_WATER_ACCESS_TOKEN && process.env.DINGTALK_WATER_SECRET) {
    return {
      accessToken: process.env.DINGTALK_WATER_ACCESS_TOKEN,
      secret: process.env.DINGTALK_WATER_SECRET
    };
  }
  return {
    accessToken: process.env.DINGTALK_ACCESS_TOKEN,
    secret: process.env.DINGTALK_SECRET
  };
}

// 封装发送钉钉消息的函数（支持不同机器人）
async function sendDingTalkMsg(text, title = "提醒", options = {}) {
  try {
    const bot = options.bot || 'default';
    const { accessToken, secret } = resolveDingTalkCredentials(bot);

    if (!accessToken || !secret) {
      throw new Error('DINGTALK_ACCESS_TOKEN and DINGTALK_SECRET environment variables are required')
    }

    let url = `https://oapi.dingtalk.com/robot/send?access_token=${accessToken}`;
    let time = Date.now();
    let stringToSign = time + "\n" + secret;
    let base = crypto.createHmac('sha256', secret).update(stringToSign).digest('base64');
    let sign = encodeURIComponent(base);
    url = url+`&timestamp=${time}&sign=${sign}`;
    let body = {
      "msgtype": "markdown",
      "markdown": {
        "title": title,
        "text": text
      }
    };
    logInfo(`Sending message to DingTalk(${bot}): ${text}`);
    await fetch(url, {
      method: 'post',
      body: JSON.stringify(body),
      headers: {'Content-Type': 'application/json'}
    });
  } catch (error) {
    logError(error, 'Error in sendDingTalkMsg function');
    throw error;
  }
}

// 每分钟检查一次任务
schedule.scheduleJob('0 * * * * *', async () => {
  try {
    await handleTasks();
  } catch (error) {
    logError(error, 'Error in scheduled job');
  }
});

// 启动时拉取本年工作日
let workdaysPromise = getWorkdaysForThisYear().catch(error => {
  logError(error, 'Error fetching workdays for this year');
  throw error;
});
// 每年12月31日自动拉取下一年
scheduleNextYearFetch(schedule);

function shouldSkipReminder(time) {
  const { hour, minute } = time;
  return (hour === 9 && minute === 0) || (hour === 18 && minute === 30);
}
