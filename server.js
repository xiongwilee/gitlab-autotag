'use strict';

require('shelljs/global');

const http = require('http');
const config = require('./config');

createServer();

/**
 * 创建server
 * @return undefined
 */
function createServer() {
  http.createServer(function (req, res) {
    let data = '';

    req.setEncoding('utf-8');
    req.addListener('data', (chunk) => {
      data += chunk;
    });

    req.addListener('end', () => {
      console.log(data);

      try {
        const result = init(req, JSON.parse(data));
        res.write(JSON.stringify(result));
      } catch (err) {
        console.error(err)
      }

      res.end();
    });

  }).listen(config.port);

  console.log('启动tag服务')
}

/**
 * 初始化方法
 * @param  {Object} data [description]
 * @return undefined
 */
function init(req, data) {
  if (!data || !req) return;

  // 通过当前请求获取配置
  const cfg = getConfig(data, config);

  // 如果token与gitlab中不匹配，则返回
  if (req.headers['x-gitlab-token'] !== cfg.gitlabToken) {
    return { code: 403, message: 'Check Gitlab Token Error!' };
  }
  // 如果当前不是mergerequest则直接返回
  if (!isMergedRequest(data, cfg)) {
    return { code: 201, message: 'Check Merge Request Status Error!' };
  }

  // 创建tag
  const tagName = createTag(data, cfg);

  // 推送钉钉消息
  if (cfg.dingtalkToken) {
    sendMsg(data, cfg, tagName);
  }

  return { code: 200, message: '' }

  /**
   * 判断当前的事件是否为merge request
   * @param  {Object}  data [description]
   * @param  {Object}  cfg  配置项
   * @return {Boolean}      [description]
   */
  function isMergedRequest(data, cfg) {
    if (data.object_kind !== 'merge_request') return false;

    // 是否为merge request完成
    const isMerged = data.object_attributes && data.object_attributes.state === 'merged';
    // 是否为merge到主分支
    const isTargetBranch = data.object_attributes && data.object_attributes.target_branch === cfg.master;

    return isMerged && isTargetBranch;
  }
}

/**
 * 通过请求内容和整体配置，获取当前repo的配置
 * @param  {Object} data   [description]
 * @param  {Object} config [description]
 * @return {Object}        [description]
 */
function getConfig(data, config) {
  const namespace = data.project.namespace;

  return config.repo[namespace] || config.repo['fe'];
}

/**
 * 发送钉钉消息
 * @param  {Object} data  响应数据
 * @return
 */
function sendMsg(data, cfg, tagName) {
  // 获取文案
  const text = getArgs(data, cfg, tagName);

  // 推送钉钉消息
  sendDingtalkMessage(text, cfg);


  /**
   * 发送钉钉消息
   * @param  {String} text [description]
   * @return undefined
   */
  function sendDingtalkMessage(text, cfg) {
    console.log(text);

    const token = cfg.dingtalkToken;
    const url = 'https://oapi.dingtalk.com/robot/send?access_token=';

    return exec(`curl -H 'Content-Type: application/json' -X POST -d '${text}' ${url}${token}`);
  }

  /**
   * 生成钉钉推送的文案
   * @param  {Object} data  [description]
   * @return {String}       [description]
   */
  function getArgs(data, cfg, tagName) {
    const obj_attr = data.object_attributes || {};
    const assignee = data.assignee || {};
    const last_commit = obj_attr.last_commit || {};
    const author = last_commit.author || {};
    const resultData = {
      msgtype: 'markdown',
      markdown: {
        title: 'Merge Request',
        // 模板字符串页支持换行，但是不支持友好的缩进，所以的通过+连接字符串
        text: `MergeRequest提示\n\n` +
          `> MR仓储: ${data.project.name}\n\n` +
          `> 上线信息: ${obj_attr.title}\n\n` +
          `> 合并分支: ${obj_attr.source_branch}\n\n` +
          `> 上线Tag: **${tagName}**\n\n` +
          `> 开发人员: ${author.name}\n\n` +
          `> 合并人员: ${assignee.name || assignee.username || author.name}\n\n` +
          `> MR详情: [view merge request](${obj_attr.url})`
      }
    }

    return JSON.stringify(resultData);
  }
}

/**
 * 绑定gitlab的merge_request的钩子，自动创建tag
 * 
 */
function createTag(data, cfg) {
  // 当前的repo名称
  const repo = data.project.name;
  // 远程地址
  const remote = cfg.remote;
  // 工作目录
  const workspace = cfg.workspace;
  // 仓储目录
  const project_path = `${workspace}/${repo}`;
  // 远程主干
  const master = cfg.master;

  if (!test('-d', workspace)) {
    exec(`mkdir ${workspace}`);
  }

  if (!test('-d', `${project_path}`)) {
    exec(`git clone -b ${master} ${remote}${repo}.git ${repo}`, { cwd: `${workspace}` });
  }

  exec(`git fetch`, { cwd: `${project_path}` });
  exec(`git clean -df`, { cwd: `${project_path}` });
  exec(`git checkout ${master}`, { cwd: `${project_path}` });
  exec(`git pull origin ${master}`, { cwd: `${project_path}` });

  // 获取tag名称
  const tagName = cfg.getTagName.call(cfg, data, project_path);
  const tagMsg = cfg.getTagMsg.call(cfg, data, project_path);

  let tagCmd = `git tag -a ${tagName}`;
  if (tagMsg) tagCmd += ' -m ${tagMsg}';

  exec(tagCmd, { cwd: `${project_path}` });
  exec(`git push origin ${tagName}`, { cwd: `${project_path}` });

  return { tagName, tagMsg };
}
