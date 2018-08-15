'use strict';

const workspacePath = __dirname + `/tags/`;

module.exports = {
  port: '2999',
  repo: {
    // gitlab 的 group名称
    '{group名称}': {
      // 代码操作目录
      workspace: workspacePath + '{group名称}-tags',
      // 远程地址
      remote: '{gitlab地址}:{group名称}/',
      // 主分支
      master: 'online',
      // tag的时间格式
      tagReg: 'YYYYMMDDHHmmss',
      // gitlabToekn，自定义即可
      gitlabToken: '{gitlabToken}',
      // 钉钉机器人的token
      dingtalkToken: '{钉钉机器人的token}'
    }
  }
};
