
## vscode 的实时翻译插件


### 背景
- 通常我有一个md文件，用vscode打开后，再使用右键菜单的"Markdown Preview Enhanced: Open Preview to the Side"命令，就可以实时查看markdown渲染后的可读格式文档了
- 但是，遇到一些纯英文的md文件，我想在预览的那个界面里，再补充使用我自己的翻译插件
- 我暂时没想好我自己的翻译插件在实时预览界面该如何调用，是选中就悬浮窗口翻译还是选中后用快捷键触发，还是说选中一段英文就在控制台里自动翻译，我不确定用哪种更好

### 翻译机制
- 翻译接口我想直接用微软的翻译接口
```request
POST https://cn.bing.com/ttranslatev3?isVertical=1&&IG=A0C5281032B941E1838D1F236D1875F9&IID=translator.5022&SFX=81
content-type:application/x-www-form-urlencoded
fromLang=auto-detect&to=zh-Hans&tone=Casual&text=realtime-translate&token=uJ_KeiJvkaxOMSjvRkZkHeT94vIGrDXk&key=1781935005146

```
其中 `text` 是需要翻译的英文文本

- 响应数据content-type:application/json; charset=utf-8，内容例子：
```response
[
    {
        "translations": [
            {
                "text": "实时翻译",
                "to": "zh-Hans",
                "transliteration": {
                    "text": "shíshí fānyì",
                    "script": "Latn"
                }
            }
        ],
        "usedLLM": true,
        "detectedLanguage": {
            "language": "en"
        }
    }
]
```
其中 `translations.text` 是翻译后的中文文本


### 呈现方式
- 我自己的翻译插件可以在vscode的左侧侧边栏里
- 插件的侧边栏界面可以配置
    - 是否要悬浮窗展示翻译内容，默认否
    - 翻译的token配置，默认空
    - 触发翻译的快捷键，默认ctrl+shift+Q
- 插件的侧边栏界面里，自动把每次选中的内容放入待翻译的输入框内，输入框旁可以有一个按钮点击也可以触发翻译
    再下方有一个只读的文本框，用来显示翻译后的内容


