var replaced = false;
if(location.hash != ""){
  document.querySelector("#tab-0").src = atob(location.hash.slice(1));
}
if(window == top){
  var win = window.open();
  console.log(win);
  if(!win){
    alert("Please allow popups to remove history completely.")
  } else{
    win.document.body.style.margin = "0";
    win.document.body.style.height = "100vh";
    var frm = win.document.createElement("iframe");
    frm.style.border = "none";
    frm.style.width = "100%";
    frm.style.height = "100%";
    frm.style.margin = "0";
    frm.referrerpolicy = "no-referrer";
    frm.allow = "fullscreen";
    frm.src = window.location.href;
    win.document.body.appendChild(frm);
    location.replace("https://www.google.com");
    replaced = true;
  }
}
if(window.self == window.top && !replaced){
  location.reload();
}
function proxyAction(action, frameID) {
  let frame = document.getElementById(frameID)

  if (frame) {
      switch (action) {
          case "back":
              frame.contentWindow.history.back()
              break;
          case "forward":
              frame.contentWindow.history.forward()
              break;
          case "reload":
              frame.contentWindow.location.reload()
              break;
      }
  }
}
async function parseUrl(string){
  if(string.includes(".")){
    if(string.startsWith("http://") || string.startsWith("https://")){
      var urlToFetch = await window.proxyEncode(string);
      try{
        var response = await fetch(urlToFetch);
        if(response.ok){
          return string;
        } else{
          return "https://www.google.com/search?q=" + string;
        }
      } catch(e){
        return "https://www.google.com/search?q=" + string;
      }
    } else{
      var urlToFetch = await window.proxyEncode("https://" + string);
      try{
        var response = await fetch(urlToFetch);
        if(response.ok){
          return "https://" + string;
        } else{
          return "https://www.google.com/search?q=" + string;
        }
      } catch(e){
        return "https://www.google.com/search?q=" + string;
      }
    }
  } else{
    return "https://www.google.com/search?q=" + string;
  }
}

document.addEventListener('DOMContentLoaded', function() {
  const addTabButton = document.getElementById('add-tab');
  const goButton = document.getElementById('go-button');
  const urlInput = document.getElementById('url-input');
  let tabCount = 1;

  // Function to switch tabs
  function switchTab(tabId) {
    const tabs = document.querySelectorAll('.tab');
    tabs.forEach(tab => {
      tab.classList.remove('active');
    });

    const tabButtons = document.querySelectorAll('.tab-button');
    tabButtons.forEach(button => {
      button.classList.remove('active');
    });

    document.getElementById(tabId).classList.add('active');
    document.querySelector(`[data-tab-id="${tabId}"]`).classList.add('active');
  }

  // Function to handle go button click
  document.querySelector("form").addEventListener('submit', async function(event) {
    event.preventDefault();
    var url = urlInput.value.trim();
    if (url !== '') {
      const activeTab = document.querySelector('iframe.tab.active');
      url = await parseUrl(url);
      activeTab.src = await window.proxyEncode(url);
    }
  });
document.querySelector('.reload').addEventListener("click", function(){
  const tabId = document.querySelector('.tab.active').id;
  reloadTab(tabId);
})
document.querySelector('.close-tab').addEventListener("click", function(){
  const tabId = document.querySelector('.tab.active').id;
  closeTab(tabId);
})
document.querySelector('.history-back').addEventListener("click", function(){
  const tabId = document.querySelector('.tab.active').id;
  historyBack(tabId);
})
document.querySelector('.history-forward').addEventListener("click", function(){
  const tabId = document.querySelector('.tab.active').id;
  historyForward(tabId);
})

  // Function to handle reload button click
  function reloadTab(tabId) {
    proxyAction('reload', tabId); // Reload iframe by resetting its src
  }

  // Function to handle close tab button click
  function closeTab(tabId) {
    const tabFrame = document.getElementById(tabId);
    const isActiveTab = tabFrame.classList.contains('active');
    const tabButton = document.querySelector(`.tab-button[data-tab-id="${tabId}"]`);
    
    // Remove tab iframe and button from DOM
    tabFrame.parentNode.removeChild(tabFrame);
    tabButton.parentNode.removeChild(tabButton);
  
    if (isActiveTab) {
      // Switch to the next available tab if it was the active tab
      const remainingTabs = document.querySelectorAll('.tab');
      if (remainingTabs.length > 0) {
        const nextTabId = remainingTabs[remainingTabs.length - 1].id;
        switchTab(nextTabId);
      } else {
        // If no tabs left, add a new tab
        addNewTab("newTab.html");
      }
    }
  }

  // Function to handle history back button click
  function historyBack(tabId) {
    proxyAction('back', tabId);
  }

  // Function to handle history forward button click
  function historyForward(tabId) {
    proxyAction('forward', tabId);
  }

  // Add initial tab
  addTabButton.addEventListener('click', function(){
    addNewTab("newTab.html");
  });

  // Function to add a new tab
  function addNewTab(url = 'about:blank') {
    const tabContent = document.querySelector('.tab-content');
    const newTabId = `tab-${tabCount}`;
    const newTabFrame = document.createElement('iframe');
    newTabFrame.id = newTabId;
    newTabFrame.classList.add('tab');
    newTabFrame.src = url; // Set new tab iframe source
    newTabFrame.setAttribute('frameborder', '0');
    newTabFrame.setAttribute('allow', 'fullscreen');
    tabContent.appendChild(newTabFrame);
  
    const newTabButton = document.createElement('button');
    newTabButton.innerHTML = `<img class="favicon" id="favicon-${tabCount}" src="defaultFavicon.jpg"> Loading...`;
    newTabButton.classList.add('tab-button');
    newTabButton.dataset.tabId = newTabId;
    newTabButton.addEventListener('click', function() {
      switchTab(newTabId);
    });
  
    const tabHeader = document.querySelector('.tabs');
    tabHeader.insertBefore(newTabButton, addTabButton);
  
    switchTab(newTabId); // Switch to the new tab
  
    tabCount++;
    newTabFrame.contentWindow.close = function() {
      closeTab(newTabId);
    }
    return newTabFrame.contentWindow;
  }
  window.windowOpenSubstitute = function(url = "about:blank", target = "_blank", json) {
    url = url.replace("/" + localStorage.getItem("session-string") + "*" + target + "/", "/" + localStorage.getItem("session-string") + "/");
    if(location.href != "about:blank"){
      if(json && json != ""){
        alert(json);
        var currentUrl = new URL(location.href);
        var win = window.open("", "_blank", json);
        win.document.body.style.margin = "0";
        win.document.body.style.height = "100vh";
        var frm = win.document.createElement("iframe");
        frm.style.border = "none";
        frm.style.width = "100%";
        frm.style.height = "100%";
        frm.style.margin = "0";
        frm.referrerpolicy = "no-referrer";
        frm.allow = "fullscreen";
        frm.src = currentUrl.origin + "/#" + btoa(url);
        win.document.body.appendChild(frm);
        var actualFrameWindow = frm.contentWindow;
        win.localStorage = window.localStorage;
        actualFrameWindow.close = function() {
          win.close();
        };
        actualFrameWindow.moveTo = function(...args) {
          win.moveTo(...args);
        };
        actualFrameWindow.moveBy = function(...args) {
          win.moveTo(...args);
        };
        actualFrameWindow.resizeTo = function(...args) {
          win.resizeTo(...args);
        };
        actualFrameWindow.resizeBy = function(...args) {
          win.resizeBy(...args);
        };
        
        return actualFrameWindow;
      } else {
        const tabContent = document.querySelector('.tab-content');
        const newTabId = `tab-${tabCount}`;
        const newTabFrame = document.createElement('iframe');
        newTabFrame.id = newTabId;
        newTabFrame.classList.add('tab');
        newTabFrame.src = url; // Set new tab iframe source
        newTabFrame.setAttribute('frameborder', '0');
        newTabFrame.setAttribute('allow', 'fullscreen');
        tabContent.appendChild(newTabFrame);
    
        const newTabButton = document.createElement('button');
        newTabButton.innerHTML = `<img class="favicon" id="favicon-${tabCount}" src="defaultFavicon.jpg"> Loading...`;
        newTabButton.classList.add('tab-button');
        newTabButton.dataset.tabId = newTabId;
        newTabButton.addEventListener('click', function() {
          switchTab(newTabId);
        });
    
        const tabHeader = document.querySelector('.tabs');
        tabHeader.insertBefore(newTabButton, addTabButton);
    
        switchTab(newTabId); // Switch to the new tab
    
        tabCount++;
        newTabFrame.contentWindow.close = function(){
          closeTab(newTabId);
        }
        return newTabFrame.contentWindow;
      }
    }
  }

  // Event delegation for handling tab button clicks
  document.querySelector('.tabs').addEventListener('click', function(event) {
    const target = event.target;

    if (target.classList.contains('tab-button')) {
      const tabId = target.dataset.tabId;
      switchTab(tabId);
    }
  });

});
function shouldAdd(i, content){
  if(document.querySelectorAll(".tab-button")[i].innerHTML != content){
    document.querySelectorAll(".tab-button")[i].innerHTML = content;
  }
}
setInterval(async function(){
  if(document.querySelector("iframe.tab.active").contentWindow.location.href != location.origin + "/newTab.html"){
    var urlParam = new URL(await proxyDecode(decodeURIComponent(document.querySelector("iframe.tab.active").contentWindow.location.href)));
    if(document.querySelector("#url-input") !== document.activeElement){
      document.querySelector("#url-input").value = urlParam.href;
    }
  }
  for(var i in document.querySelectorAll(".tab")){
    var currentTab = document.querySelectorAll(".tab")[i];
    var currentTabTitle = [];
    var currentTabFavicon = [];
    if(currentTab.contentWindow){
      if(currentTab.contentWindow.location.href != location.origin + "/newTab.html"){
        var currentUrlParam = new URL(await proxyDecode(decodeURIComponent(currentTab.contentWindow.location.href)));
      }
      if(currentTab.contentDocument){
        currentTabTitle = currentTab.contentDocument.title;
        currentTabFavicon = currentTab.contentDocument.querySelector('link[rel="icon"]') || currentTab.contentDocument.querySelector('link[rel="shortcut icon"]') || currentTab.contentDocument.querySelector('link[rel="apple-touch-icon"]');
      } else{
        currentTabTitle = currentTab.contentWindow.document.title;
        currentTabFavicon = currentTab.contentWindow.document.querySelector('link[rel="icon"]') || currentTab.contentWindow.document.querySelector('link[rel="shortcut icon"]') || currentTab.contentWindow.document.querySelector('link[rel="apple-touch-icon"]');
      }
      if(!currentTabFavicon && currentTab.contentWindow.location.href != location.origin + "/newTab.html"){
        var response = await fetch("/check-favicon/" + currentUrlParam.origin);
        var json = await response.json();
        if(json.message){
          currentTabFavicon = {};
          currentTabFavicon.href = currentUrlParam.origin + "/favicon.ico";
        }
      }
    }
    if(!currentTabFavicon){
      currentTabFavicon = {};
      currentTabFavicon.href = "defaultFavicon.jpg";
    }
    if(currentTabTitle == ''){
      var currentCount = parseInt(document.querySelector("iframe.tab.active").getAttribute("id").replace("tab-", ""));
      if(document.querySelector("iframe.tab.active").contentWindow.location.href != location.origin + "/newTab.html"){
        if(urlParam.href == urlParam.origin + "/"){
          shouldAdd(i, `<img class="favicon" id="favicon-${currentCount}" src="${currentTabFavicon.href}"> ` + urlParam.hostname);
        } else{
          shouldAdd(i, `<img class="favicon" id="favicon-${currentCount}" src="${currentTabFavicon.href}"> ` + urlParam.href.replace(urlParam.protocol + "//", ""));
        }
      }
    } else{
      shouldAdd(i, `<img class="favicon" id="favicon-${currentCount}" src="${currentTabFavicon.href}"> ` + currentTabTitle);
    }
  }
  if(document.querySelector("#url-input") !== document.activeElement){
    if(document.querySelector("iframe.tab.active").contentWindow && !document.querySelector("iframe.tab.active").contentWindow.location.href.startsWith(location.origin + "/newTab.html")){
    } else if(document.querySelector("iframe.tab.active").contentWindow.location.href.startsWith(location.origin + "/newTab.html")){
      document.querySelector("#url-input").value = document.querySelector("iframe.tab.active").getAttribute("name");
    }
  } else{
    if(document.querySelector("iframe.tab.active").contentWindow.location.href.startsWith(location.origin + "/newTab.html")){
      document.querySelector("iframe.tab.active").setAttribute("name", document.querySelector("#url-input").value);
    }
  }
}, 100);