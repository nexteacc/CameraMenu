有开发能力的用户可以通过调用 HTTP API 来翻译文档，把翻译的动作集成到个人或者企业的工作流程中。

目前，调用 API 并不需要支付额外的费用，只是跟网页版一样，翻译文档需要消耗用户的积分。

## 使用方式

调用 API 前，你需要创建自己的 API 密钥。

登入工作台，点击菜单中的个人头像，选择 “API”，可以进入密钥管理页面。

调用时，密钥以 Authorization Bearer 的方式放在 Header 中。如下面的例子

```
curl -X POST 'https://translate.simplifyai.cn/api/v1/translations' \
  -H 'Authorization: Bearer at-NjhhZmVlZTktNWNENC0yNGJkLTQ0OWItMWUyY2I5ODBjYzQh' \
  --form 'file=@bitcoin.pdf' \
  --form 'fromLang=English' \
  --form 'toLang=Simplified Chinese' -i
```

其中 at-NjhhZmVlZTktNWNENC0yNGJkLTQ0OWItMWUyY2I5ODBjYzQh 应该替换为你的密钥。

## API - 翻译任务

### 创建翻译任务

上传文档，指定翻译的语言，创建新的翻译任务

```
POST https://translate.simplifyai.cn/api/v1/translations
```

**参数：**

- **file - （必填）需要翻译的文件**
- **fromLang - (必填）被翻译的语言**
- **toLang - (必填）翻译成什么语言**
- glossary - （非必填）指定的术语表名称，这里的名称是用户在网站上建立术语表时填写的名字
- glossaryId - （非必填）指定的术语表 ID，这个参数比 glossary 优先级更高：当两个参数都提供时，会使用这个参数指定的术语表
- glossaryContent - (非必填）直接传入术语表的内容，比 glossaryId 优先级更高。内容是由原文和对应译文组成的 key value JSON 对象，见“创建术语表”中的 content 参数说明
- model - (非必填）指定翻译模型。 可以通过下面的“查询可用模型”获取模型名称，如果不指定值的话，我们默认使用第一个。
- clientTaskId - （非必填）客户任务 ID，是 API 调用方提供的任务标识，长度不能超过 128，在同一个账户内必须唯一。可以用来查询翻译任务的状态，见“查询翻译任务”，适用于创建翻译任务时出现网络中断以致未能获取任务 ID 的情况
- autoStart - (非必填）默认是 true，也就是说，当积分足够时，任务创建完会自动开始全文翻译。可以传入 false，创建完后不会开始翻译； 或者传入代表积分上限的数字，仅当所需积分**小于**这个数时，才会自动翻译
- strictLanguageCheck -（非必填）对源语言文本的检查，默认是 false，此时只是基于字符集来判断源语言种类，这样意味着一个英译中任务的文档中假设同时有英语和法语，可能两种语言都会被翻译成中文。传入 true ，可以避免这种情况，但这样价格会高 50%，因为在翻译前要使用 LLM 逐句判断原文本的语言种类。
- **shouldTranslateImage - (非必填）是否要翻译 PDF 文档中的图片，默认是 false，一般建议指定为 true。当指定为 true 时，会检测文件里的图片，并自动对含有图片的页进行 OCR 翻译。这样价格一般会高一些。具体参考“价格说明”。**
- shouldTranslateFileName - (非必填）是否要翻译文件名，默认是 false。如果是 true，文件名也会被翻译成成目标语言
- fastCreation - （非必填）是否要快速创建任务并返回。默认是 false。 如果指定为 true，服务器收到请求后，会先创建一个任务记录，然后立即返回记录的 ID 和 Analyzing 状态。分析文档和计算价格的工作，会异步在服务器端进行，分析完后会**自动扣积分启动任务**（仍然遵循 autoStart 的规则）。  但如果指定了 previewCredits 或者传入了 webhookUrl ， 任务不会被自动执行，需要客户端自己通过 PUT 请求启动任务。
- webhookUrl - （非必填）获取任务状态变更通知的回调地址。如果提供了回调地址，当任务的状态和进度变更时，服务器端会自动发送 POST 请求，把  { id: <id>, status: <Status>, progress: <p> } 的 JSON 请求发送到回调地址中，其中 <p> 为从 0 ~ 100 的带小数的数字。
- previewCredits - (非必填）支付用于预览的积分。如果账户余额不足，则创建失败。服务端会自动根据积分计算需要翻译的 token 量进行翻译。如果用于预览的积分大于文档所需积分，则会完整翻译整篇文档。当传入 previewCredits 后， fastCreation 和 autoStart 都不再生效。
- forceOCR - (非必填）如果指定为 true，则一定会先使用 OCR 识别文字然后再翻译，适用于正常翻译会出现全是乱码的情况
- noResize - (非必填) 仅用于 PPTX，如果指定为 true，那么在生成 PPTX 的译文时，将不会尝试改变它里面的字号大小。
- __experimental_temperature - (非必填）指定 LLM 翻译时使用的 temperature 参数，必须大于 0 且 小于 1
- __experimental_translationAction - (非必填) 指示 LLM 翻译时使用的动词，可以是 Translate, Rewrite 或者 Revise。
- __experimental_translationRule - (非必填) 建议 LLM 翻译时遵循的规则、风格等，建议用英语，小于 100 字符。

其中 fromLang 和 toLang 的可选值，可以通过专门的接口获取，见下面的“查询可用语言“

__experimental_ （前面两个下划线，后面一个下划线）前缀的参数不一定会一直保留。

**正常返回 201：**

- taskId - 翻译任务的 ID，用于查询任务的状态和文件地址
- price - 翻译任务需要的积分（如果支付了预览积分，则这是除去预览之外剩下部分所需的积分）
- totalPrice - 翻译任务需要的总积分（price + previewCredits）
- status - 任务状态，可选值见“查询翻译任务”

**异常返回：**

- 401 - 没有提供正确的 API 密钥
- 400 - 参数不全
- 402 - 积分余额不够，此时任务仍然会被创建，会返回 taskId 和 price，但不会像网页端一样部分翻译用作预览。用户购买余额后，可以通过专门的接口来启动任务，见下面的“启动翻译任务”
- 429 - 调用太频繁，默认十秒内最多创建十个翻译任务
- 500 - 服务器端出现的其他错误

### 查询翻译任务

根据任务 ID ，或者客户任务 ID 来查询翻译任务的状态

```
GET https://translate.simplifyai.cn/api/v1/translations/:id

// or

GET https://translate.simplifyai.cn/api/v1/translations?id=:id

// or

GET https://translate.simplifyai.cn/api/v1/translations?clientTaskId=:clientTaskId
```

其中 :id 应替换为具体的 taskId,  :clientTaskId 应替换为具体的客户任务ID。

译文的 URL 有时限，最长两小时，过期后要重新使用查询接口获取新的 URL。

**参数：**

- withTexts - （非必填）不需要值，如果提供了这个参数，则返回系统提取的一一对应的原文和译文，见在字段 "texts"，以及 revisedTexts（已使用的修订文本）
- textsInArray - （非必要）不需要值，如果提供了这个参数和 withTexts，那么对应的原文译文则是以数组格式返回，见 texts 字段的说明。

**正常返回 200：**

- **taskId - 翻译任务的 ID**
- status - 任务状态，可能是 Analyzing, Unpaid, Waiting, PreviewProcessing, PreviewCompleted, Processing, Completed, Cancelled, Terminated, NotSupported.  其中 PreviewProcessing 和 PreviewCompleted 只会出现在提供 previewCredits 的任务中。
- **progress - 进度，0 到 100，带小数的数字**
- **originalFileUrl - 原文档的 URL**
- **translatedFileUrl - 译文文档的 URL，翻译完成才有。**
- **bilingualFileUrl - 双语文档的 URL，翻译完成才有。**
- price - 翻译任务需要的积分（如果支付了预览积分，则这是除去预览之外剩下部分所需的积分）
- totalPrice - 翻译任务需要的总积分（price + previewCredits）
- totalToken - 需要翻译的 token 总数
- texts - 如果在参数中指定了 withTexts，则返回系统提取的一一对应的原文和译文，以 JSON 的格式，默认是以 key-value 的格式，key 是原文，value 是译文； 如果指定了 textsInArray，则是以双层数组的格式，`[[原文, 译文]].
- revisedTexts - 如果在参数中指定了 withTexts，则用户主动上传用于重新生成文档的提取的修订译文，以 JSON 的格式

**异常返回：**

- 401 - 没有提供正确的 API 密钥
- 404 - ID 对应的翻译任务不存在，或者已删除，或者不是当前用户创建的
- 500 - 服务器端出现的其他错误

### 删除翻译任务

根据 ID 删除指定的翻译任务。删除前请确保你已经把译文下载好了。

```
DELETE https://translate.simplifyai.cn/api/v1/translations/:id
```

**正常返回 204**

**异常返回：**

- 401 - 没有提供正确的 API 密钥
- 404 - ID 对应的翻译任务不存在，或者已删除，或者不是当前用户创建的
- 500 - 服务器端出现的其他错误

### 启动翻译任务

正常来说，创建翻译任务后会自动消费积分完整翻译。但如果因为积分不足导致 Unpaid，或者因为其他错误导致 Terminated，可以通过这个接口重新启动翻译任务。

如果 Unpaid 会尝试先扣积分再翻译，已经支付的 Terminated 则是直接重新启动翻译。

```
PUT https://translate.simplifyai.cn/api/v1/translations/:id
```

**参数：**

- revisedTexts - 非必填。当翻译已完成后，可以用这个参数来提交人工修订的译文，以重新生成文件。revisedTexts 跟 GET 回来的 texts 的格式一样，也是原文译文一一对应的 key-value json。如 {"Bitcoin: A Peer-to-Peer Electronic Cash System":"比特币：点对点的电子现金系统"}。
- showInvisibleText - 显示不可见文字。非必填，可以是true。PDF 翻译时会检查文字的可见性，如果判断文字不可见，则不会显示它。但这个检查有可能会出错，如果遇到原文中可见的文字在译文中被隐藏了，可以使用这个参数来强制让它们出现。
- fixBackground - 修复 PDF 背景。非必填，可以是true。一般不需要使用。

**正常返回 200：**

- status - 任务状态，可能是 Unpaid, Waiting, Processing, Completed, Cancelled, Terminated, NotSupported
- progress - 进度，0 到 100
- price - 翻译任务需要的积分（如果支付了预览积分，则这是除去预览之外剩下部分所需的积分）
- totalPrice - 翻译任务需要的总积分（price + previewCredits）
- totalToken - 需要翻译的 token 总数

异常返回：

- 401 - 没有提供正确的 API 密钥
- 404 - ID 对应的翻译任务不存在，或者已删除，或者不是当前用户创建的
- 402 - 积分余额不够
- 409 - 文档仍然在分析中（Analyzing 状态）
- 500 - 服务器端出现的其他错误

## API - 信息查询

### 查询可用语言

返回可用语言的值，用在“创建翻译任务”中的 fromLang 和 toLang 参数中

```
GET https://translate.simplifyai.cn/api/v1/languages

// or

GET https://translate.simplifyai.cn/api/v1/languages?names
```

**参数：**

- names - 如果提供了这个参数（不需要特定值），则返回值会包含中文名

**正常返回 200：**

- 字符串的的数组，每个字符串代表一种语言，用于翻译时指定语言，如“Simplified Chinese”；如果请求中提供了 names 参数，则是返回包含 { name, value } 的数组，其中 name 是该语言的中文名，如“简体中文”，value 是用于翻译时指定语言的值，如“Simplified Chinese”。

### 查询可用文件扩展名

返回支持的文件扩展名，如 .pdf 之类的

```
GET https://translate.simplifyai.cn/api/v1/filetypes
```

**参数：**

- 无

**正常返回 200：**

- 字符串的的数组，每个字符串代表一种文件的扩展名，如 .pdf, .docx 等



### 查询可用模型

返回支持的模型名称

```
GET https://translate.simplifyai.cn/api/v1/modelNames
```

**参数：**

- 无

**正常返回 200：**

- 字符串的的数组，每个字符串代表一个模型名

## API - 术语表管理

### 创建术语表

添加新的术语表

```
POST https://translate.simplifyai.cn/api/v1/glossaries

// Example:

curl -X POST 'https://translate.simplifyai.cn/api/v1/glossaries' \
  -H 'Authorization: Bearer at-...' \
  --form 'name=LLM' \
  --form 'content={"Chain of Thought": "思维链"}' -i
```

**参数：**

- name -（必填）术语表名称，不能跟用户之前创建的术语表名称重复
- content - (必填）JSON 字符串，里面所有的 key 是原文，对应的 value 是译文，如 {"chain of thought": "思维链"}

**正常返回 201：**

- id - 术语表 ID，用于在翻译中指定术语表，或者查询、更改术语表信息
- name - 术语表名称

**异常返回：**

- 401 - 没有提供正确的 API 密钥
- 400 - 参数不全或者不对
- 500 - 服务器端出现的其他错误

### 查询用户的所有术语表

查询当前用户的所有术语表

```
GET https://translate.simplifyai.cn/api/v1/glossaries
```

**请求参数：**

- offset -（非必填）按照创建时间的逆序，从第几个开始返回，默认为 0
- limit - (非必填）一次返回多少条记录，默认为 20， 最大为 1000

**正常返回 200：**

- data - 数组，每条数据都是 { id, name }  包含术语表的 ID 和名称 
- count - 该用户总共有多少个术语表
- offset - 这次是从第几个开始查询的

**异常返回：**

- 401 - 没有提供正确的 API 密钥
- 500 - 服务器端出现的其他错误

### 查询指定术语表

根据 ID ，查询术语表

```
GET https://translate.simplifyai.cn/api/v1/glossaries/:id
```

**正常返回 200：**

- id - 术语表的 ID
- name: 术语表的名称
- content: 术语表的内容，JSON 格式

**异常返回：**

- 401 - 没有提供正确的 API 密钥
- 404 - ID 对应的术语表不存在，或者已删除，或者不是当前用户创建的
- 500 - 服务器端出现的其他错误

### 更改术语表

修改术语表的名称或者内容

```
PUT https://translate.simplifyai.cn/api/v1/glossaries/:id
```

**参数：**

- name -（非必填）术语表名称，不能跟用户之前创建的术语表名称重复
- content - (非必填）JSON 字符串，里面所有的 key 是原文，对应的 value 是译文，如 {"chain of thought": "思维链"}

**正常返回 200：**

- id - 术语表 ID

**异常返回：**

- 401 - 没有提供正确的 API 密钥
- 400 - 参数不对
- 404 - ID 对应的术语表不存在，或者已删除，或者不是当前用户创建的
- 500 - 服务器端出现的其他错误

### 删除术语表

删除指定术语表

```
DELETE https://translate.simplifyai.cn/api/v1/glossaries/:id
```

**正常返回 204**

**异常返回：**

- 401 - 没有提供正确的 API 密钥
- 404 - ID 对应的术语表不存在，或者已删除，或者不是当前用户创建的
- 500 - 服务器端出现的其他错误

## API - 账户信息

### 获取账户信息

查询当前用户的账户信息，目前只返回余额

```
GET https://translate.simplifyai.cn/api/v1/me
```

**正常返回 200：**

- balance - 积分余额

**异常返回：**

- 401 - 没有提供正确的 API 密钥
- 500 - 服务器端出现的其他错误