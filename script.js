// Boyer-Moore算法的预处理部分（支持Unicode）
function preprocessBadCharacterTable(pattern) {
    const badCharTable = {};
    for (let i = 0; i < pattern.length; i++) {
        badCharTable[pattern[i]] = i;
    }
    return badCharTable;
}

// Boyer-Moore算法的主函数（支持Unicode）
function boyerMoore(text, pattern) {
    const badCharTable = preprocessBadCharacterTable(pattern);
    const n = text.length;
    const m = pattern.length;
    const occurrences = [];

    let shift = 0;
    while (shift <= n - m) {
        let j = m - 1;

        // 从右到左匹配模式
        while (j >= 0 && pattern[j] === text[shift + j]) {
            j--;
        }

        if (j < 0) {
            occurrences.push(shift);
            shift += (shift + m < n) ? m - (badCharTable[text[shift + m]] ?? -1) : 1;
        } else {
            shift += Math.max(1, j - (badCharTable[text[shift + j]] ?? -1));
        }
    }
    return occurrences;
}

// 高亮关键字
function highlightKeyword(text, keyword) {
    const regex = new RegExp(`(${keyword})`, 'gi');
    return text.replace(regex, '<strong>$1</strong>');
}

// 根据章节结构解析文本
function splitIntoChapters(text) {
    // 使用"Chapter"作为分隔符分割文本
    const chapters = text.split(/(?=Chapter\d{1,5} )/).filter(Boolean);

    // 将章节标题和内容分离
    const chapterList = chapters.map(chapter => {
        // 使用RegExp对象进行匹配
        const titleMatch = chapter.match(/^Chapter(\d{1,5}) (.+?)(?=\r?\n|\r|\n\r|$)/);
        if (titleMatch) {
            return {
                title: `第${titleMatch[1]}章-${titleMatch[2].trim()}`,  // 格式化标题
                content: chapter.substring(titleMatch[0].length).trim()  // 提取内容
            };
        } else {
            console.warn('Chapter without title:', chapter);
            return {
                title: 'Unknown Chapter',
                content: chapter.trim()
            };
        }
    });

    return chapterList;
}

let chapters = []; // 用于存储拆分后的章节数据

// 根据章节结构解析文本
function splitIntoChapters(text) {
    const chapters = text.split(/(?=Chapter\d{1,5} )/).filter(Boolean);

    return chapters.map(chapter => {
        const titleMatch = chapter.match(/^Chapter(\d{1,5}) (.+?)(?=\r?\n|\r|\n\r|$)/);
        if (titleMatch) {
            return {
                title: `第${titleMatch[1]}章-${titleMatch[2].trim()}`,
                content: chapter.substring(titleMatch[0].length).trim()
            };
        } else {
            console.warn('Chapter without title:', chapter);
            return {
                title: 'Unknown Chapter',
                content: chapter.trim()
            };
        }
    });
}

// 页面加载时初始化小说文本
async function initialize() {
    try {
        const response = await fetch('novel.txt');
        if (!response.ok) throw new Error('Failed to fetch the novel text');
        const novelText = await response.text();

        // 将小说文本分章节
        chapters = splitIntoChapters(novelText);
        console.log('Initialization Successed!');
    } catch (error) {
        console.error('Error during initialization:', error);
    }
}

// 读取小说并执行搜索
async function searchKeyword() {
    const keyword = document.getElementById('search').value.trim();
    if (keyword === '') return;

    try {
        let results = [];
        let totalOccurrences = 0;

        // 在每个章节中搜索关键字
        chapters.forEach((chapter, chapterIndex) => {
            if (!chapter.content) {
                console.warn(`Chapter ${chapter.title} is missing content.`);
                return;
            }
            const occurrences = boyerMoore(chapter.content, keyword);
            totalOccurrences += occurrences.length;
            occurrences.forEach(offset => {
                const contextStart = Math.max(0, offset - 50);
                const contextEnd = Math.min(chapter.content.length, offset + keyword.length + 50);
                const context = chapter.content.substring(contextStart, contextEnd);
                const highlightedContext = highlightKeyword(context, keyword);

                results.push({
                    chapter: chapter.title,
                    context: highlightedContext,
                    index: chapterIndex
                });
            });
        });

        // 显示结果统计
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = `
            <div class="summary">
                ${totalOccurrences > 0
                    ? `<p class="highlight">"${keyword}" 出自剑来！</p>`
                    : `<p class="highlight">"${keyword}" 很可能不出自剑来。</p>`
                }
                <p>一共出现了 ${totalOccurrences} 次。</p>
            </div>`;

        // 显示结果
        if (results.length === 0) {
            resultsDiv.innerHTML += `<p>没找到"${keyword}"。</p>`;
        } else {
            results.forEach((result, index) => {
                resultsDiv.innerHTML += `
                    <div class="result">
                        <div class="result-header">${index + 1}.出自剑来${result.chapter}章</div>
                        <div class="result-content">...${result.context}...</div>
                    </div>`;
            });
        }
    } catch (error) {
        console.error('Error:', error);
        document.getElementById('results').innerHTML = `<p>Error: ${error.message}</p>`;
    }
}

document.getElementById("replaceButton").addEventListener("click", function() {
    // 显示加载提示框
    document.getElementById("loadingOverlay").style.display = "flex";

    // 模拟一个延时，模拟搜索过程（比如1秒钟）
    setTimeout(function() {
        // 隐藏加载提示框
        document.getElementById("loadingOverlay").style.display = "none";
    }, 1000); // 模拟1秒的延时
});

// 在页面加载时初始化
document.addEventListener('DOMContentLoaded', initialize);
