// holidays.js
import fetch from 'node-fetch';
import fs from 'fs';
import path from 'path';

const workdayFile = path.resolve('./data/workdays.json');

export async function fetchYearWorkdays(year) {
  const url = `https://cdn.jsdelivr.net/gh/NateScarlet/holiday-cn@master/${year}.json`;
  const res = await fetch(url);
  const data = await res.json();
  // 先生成全年所有日期的工作日和休息日
  let allWorkdays = [];
  let allOffdays = [];
  const start = new Date(`${year}-01-01`);
  const end = new Date(`${year}-12-31`);
  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().slice(0, 10);
    if (d.getDay() === 0 || d.getDay() === 6) {
      allOffdays.push(dateStr); // 默认周六日为休息日
    } else {
      allWorkdays.push(dateStr); // 默认周一到周五为工作日
    }
  }
  // 用接口数据修正调休
  if (data && data.days) {
    data.days.forEach(d => {
      if (d.isOffDay) {
        // 休息日，移出工作日，加入休息日
        allWorkdays = allWorkdays.filter(x => x !== d.date);
        if (!allOffdays.includes(d.date)) allOffdays.push(d.date);
      } else {
        // 工作日，移出休息日，加入工作日
        allOffdays = allOffdays.filter(x => x !== d.date);
        if (!allWorkdays.includes(d.date)) allWorkdays.push(d.date);
      }
    });
  }
  // 排序
  allWorkdays.sort();
  allOffdays.sort();
  fs.writeFileSync(workdayFile, JSON.stringify(allWorkdays, null, 2));
  // 你也可以把 allOffdays 存到 offdays.json
  return allWorkdays;
}

export function isTodayWorkday(workdays) {
  const today = new Date().toISOString().slice(0, 10);
  return workdays.includes(today);
}

export async function getWorkdaysForThisYear() {
  const year = new Date().getFullYear();
  if (fs.existsSync(workdayFile)) {
    const workdays = JSON.parse(fs.readFileSync(workdayFile, 'utf-8'));
    // 检查本地数据是否为今年
    if (!workdays.some(d => d.startsWith(year.toString()))) {
      return await fetchYearWorkdays(year);
    }
    return workdays;
  } else {
    return await fetchYearWorkdays(year);
  }
}

// 每年12月31日23:59:59自动获取下一年工作日
export function scheduleNextYearFetch(schedule) {
  schedule.scheduleJob('59 59 23 31 12 *', async () => {
    const nextYear = new Date().getFullYear() + 1;
    await fetchYearWorkdays(nextYear);
  });
}
