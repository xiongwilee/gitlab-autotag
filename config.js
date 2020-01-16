'use strict';

const moment = require('moment');

const workspacePath = `${__dirname}/tags/`;

module.exports = {
  port: '2999',
  repo: {
    // Gitlab 的 group名称
    '{group名称}': {
      // 代码操作目录
      workspace: `${workspacePath}{group名称}-tags`,
      // 远程地址
      remote: '{gitlab地址}:{group名称}/',
      // 主分支
      master: 'online',
      // 获取tagName的方法，可直接使用cmd命令，例如exec(`shell command`)
      getTagName(hook_data, project_path) {
        return `online_${moment(new Date()).format('YYYYMMDDHHmmss')}`;
      },
      // 获取tag message的方法，可直接使用cmd命令，例如exec(`shell command`)
      getTagMsg(hook_data, project_path) {
        return false;
      },
      // GitlabToekn，自定义即可
      gitlabToken: '{gitlabToken}',
      // 钉钉机器人的token
      dingtalkToken: '{钉钉机器人的token}'
    }
  }
};
