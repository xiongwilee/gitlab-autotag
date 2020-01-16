# gitlab-autotag

Merge Request后自动打tag并在钉钉群里通知；

### 示例

Merge Request 自动打tag例如：
```
online_20171221195930
```

钉钉群里通知的内容，参考：
```
MR合并提示
    MR仓储: auto_store
    上线信息: upd : 测试tag
    合并分支: f_wenqi_master
    上线Tag: online_20171221195930
    开发人员: luowenqi
    合并人员: luowenqi
    PR详情: view merge request
```

### 使用说明

### 1、 配置(`./config.js`)

详细说明如下：

```
// '{group名称}' 为group名称，再如：https://{gitlab地址}/{项目名称} 下的代码,则为'{项目名称}'
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
```

### 2、添加gitlab的webhook（需至少master权限）

访问：https://{gitlab地址}/${group}/${repo_name}/settings/integrations 。**注意：这里需要当前登录用户的在该repo下的master权限**。

需填写：
- URL: `http://${部署机器的IP}:2999` ，直接配置为这个地址即可；
- Secret Token: `{gitlabToken}`，对应上述配置的gitlabToken参数；
- Trigger: `Merge Request events` ，选中Merge Request events即可，其他的不需要选择；

然后，点击“Add webhook”按钮即可。

### 3、添加钉钉群的群机器人

**第一步：添加机器人** 

到你想要的添加的群通知机器人的群，点击右上角的机器人的icon：`进入“群机器人”管理界面` → `点击最下方的“自定义（通过Webhook接入自定义服务）` → `点击“添加”按钮`；

你会得到一个链接。

**第二步：获取dingtalkToken**

在上一步你得到的链接中的`access_token`参数就对应配置中的`dingtalkToken`，配置即可。


至此，对应仓储merge request之后自动打tag和merge值之后群里通知功能的配置就已经完成了。

### 4、启动服务

```
$ pm2 start process.json
```
