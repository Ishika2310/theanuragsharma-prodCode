import"./modulepreload-polyfill.js";import"./config.js";let g=[],b=null,k=1,M=10,I=[],x="",V="all";const Q=document.getElementById("back-to-top");Q&&(window.addEventListener("scroll",()=>{window.scrollY>100?Q.style.display="flex":Q.style.display="none"}),Q.addEventListener("click",e=>{e.preventDefault(),window.scrollTo({top:0,behavior:"smooth"})}));const W=document.getElementById("navbarContent"),Re=document.querySelector(".navbar-toggler");if(W&&Re){let e=0;window.addEventListener("scroll",()=>{if(window.innerWidth<992){const t=window.scrollY;if(Math.abs(t-e)>50){const n=bootstrap.Collapse.getInstance(W);n&&W.classList.contains("show")&&n.hide(),e=t}}})}function U(){try{typeof window.refreshBookingCalendar=="function"?(console.log("Refreshing booking calendar..."),window.refreshBookingCalendar()):console.log("Booking calendar refresh function not available")}catch(e){console.log("Error refreshing booking calendar:",e)}}async function Pe(){console.log("Testing Google Apps Script endpoints...");const e=[{name:"Get Appointments",action:"getAppointments"},{name:"Get Blocked Dates",action:"getBlockedDates"},{name:"Get Available Dates",action:"getAvailableDates"}],t={};for(const n of e)try{console.log(`Testing ${n.name}...`);const o=await fetch(CONFIG.GOOGLE_SCRIPT_URL+"?action="+n.action+"&test=true",{method:"GET",redirect:"follow",cache:"no-cache"});if(o.ok)try{const s=await o.json();t[n.name]={status:o.status,ok:!0,available:s.success||!1,test:s.test||!1,message:s.message||"OK"}}catch{t[n.name]={status:o.status,ok:!0,available:!0,test:!1,message:"Response not JSON, but endpoint accessible"}}else t[n.name]={status:o.status,ok:!1,available:!1,error:`HTTP ${o.status}`};console.log(`${n.name}: ${t[n.name].available?"Available":"Error "+o.status}`)}catch(o){t[n.name]={status:"Network Error",ok:!1,available:!1,error:o.message},console.log(`${n.name}: Failed - ${o.message}`)}return console.table(t),t}window.testGoogleAppsScriptEndpoints=Pe;function ne(e){return{generalized:"Generalized",specialized:"Specialized (Virtual)","super-specialized":"Super-Specialized (In-Person)","long-term-engagement":"Long-term Projects","advisory-service":"Advisory"}[e]||e}document.addEventListener("DOMContentLoaded",function(){if(!fe()){window.location.href="admin-login.html";return}document.getElementById("dashboard").style.display="block",J(),document.getElementById("statusFilter").addEventListener("change",_);const e=document.getElementById("loginHistoryBtn");e&&e.addEventListener("click",ce);const t=document.getElementById("actionsGuideBtn");t&&t.addEventListener("click",en);const n=document.getElementById("manageCredentialsBtn");n&&(Z()?(n.style.display="inline-block",n.addEventListener("click",xe)):n.style.display="none");const o=document.getElementById("manageDatesBtn");o&&(Z()?o.style.display="inline-block":o.style.display="none"),Bt(),Le(),ee(),O(),(window.location.hostname==="localhost"||window.location.hostname==="127.0.0.1")&&Rt(),Ae(),Ne(),Be()});function Be(){const e=document.getElementById("exportStatusFilter"),t=document.getElementById("exportClientStatusFilter"),n=document.getElementById("exportSessionTypeFilter"),o=document.getElementById("exportDateFrom"),s=document.getElementById("exportDateTo"),a=document.getElementById("exportSearchText");e&&e.addEventListener("change",C),t&&t.addEventListener("change",C),n&&n.addEventListener("change",C),o&&o.addEventListener("change",C),s&&s.addEventListener("change",C),a&&a.addEventListener("input",$e(C,300))}function $e(e,t){let n;return function(...s){const a=()=>{clearTimeout(n),e(...s)};clearTimeout(n),n=setTimeout(a,t)}}function Z(){const e=localStorage.getItem("adminSession");if(!e)return!1;try{const n=JSON.parse(e).role||"";return n==="Super Admin"||n==="Admin"}catch(t){return console.error("Error checking admin permissions:",t),!1}}function fe(){const e=localStorage.getItem("adminSession");if(!e)return!1;try{const t=JSON.parse(e),n=new Date().getTime();return n<t.expiryTime?(t.lastActivity=n,localStorage.setItem("adminSession",JSON.stringify(t)),!0):(localStorage.removeItem("adminSession"),!1)}catch(t){return console.error("Error parsing session data:",t),localStorage.removeItem("adminSession"),!1}}function Ae(){setInterval(()=>{fe()?ee():(c("Session expired. Please login again.","warning"),setTimeout(()=>{window.location.href="admin-login.html"},3e3))},300*1e3),setInterval(()=>{ee()},60*1e3),setInterval(async()=>{try{console.log("Auto-refreshing appointments to check for new feedback..."),await O(),console.log("Auto-refresh completed successfully")}catch(e){console.log("Auto-refresh failed:",e)}},120*1e3)}function Le(){const e=document.createElement("div");e.id="alertContainer",e.className="alert-container",e.style.cssText=`
        position: fixed;
        top: 80px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 9999;
        width: 90%;
        max-width: 600px;
        pointer-events: none;
    `,document.body.appendChild(e)}function ee(){const e=localStorage.getItem("adminSession"),t=document.getElementById("loggedUserDisplay");if(e&&t)try{const n=JSON.parse(e),o=n.name||"Admin",s=n.role||"Administrator",a=document.getElementById("loggedUserName");a&&(a.textContent=o,t.title=`${o} - ${s}`)}catch(n){console.error("Error displaying session info:",n)}}function Ne(){document.querySelectorAll(".stats-card").forEach(n=>{n.addEventListener("click",function(){const o=this.dataset.stat;if(o){const s=document.getElementById("statusFilter");o==="approved"?(s.value="",I=g.filter(d=>{const l=d.status||"Pending";return l==="Approved"||l==="Payment Sent"||l==="Session Scheduled"||l==="Session Reminder Sent"||l==="Consent Email Sent"||l==="Session Completed"}),k=1,A(),$(),P()):o==="rejected"?(s.value="",I=g.filter(d=>{const l=d.status||"Pending";return l==="Rejected"||l==="Cancelled"}),k=1,A(),$(),P()):(s.value=Fe(o),_()),this.style.animation="pulse 0.6s ease-in-out",setTimeout(()=>{this.style.animation=""},600);const a=document.getElementById("searchResultsIndicator");a&&a.style.display!=="none"&&a.scrollIntoView({behavior:"smooth",block:"center"}),c(`Filtered to show ${o} appointments`,"info")}})}),document.querySelectorAll(".action-btn").forEach(n=>{n.addEventListener("mouseenter",function(){}),n.addEventListener("mouseleave",function(){})});const e=document.querySelector('[onclick="loadAppointments()"]');e&&e.addEventListener("click",function(){const n=this.querySelector("i");n&&(n.style.animation="spin 1s linear infinite",setTimeout(()=>{n.style.animation=""},2e3))});const t=document.getElementById("statusFilter");t&&t.addEventListener("change",function(){setTimeout(()=>{const n=document.getElementById("searchResultsIndicator");n&&n.style.display!=="none"&&n.scrollIntoView({behavior:"smooth",block:"center"})},100)})}function Fe(e){return{pending:"Pending",approved:"",rescheduled:"Session Rescheduled",rejected:"Rejected"}[e]||""}function Me(){if(g.length===0){c("No data to export!","warning");return}Ge()}function ge(){if(g.length===0){c("No appointments available to export!","warning");return}pe(),C(),new bootstrap.Modal(document.getElementById("exportFilterModal")).show()}function pe(){document.getElementById("exportStatusFilter").selectedIndex=-1,document.getElementById("exportClientStatusFilter").selectedIndex=-1,document.getElementById("exportSessionTypeFilter").selectedIndex=-1,document.getElementById("exportDateFrom").value="",document.getElementById("exportDateTo").value="",document.getElementById("exportSearchText").value="",C()}function C(){const e=he(),t=document.getElementById("previewNumber");t&&(t.classList.add("updating"),setTimeout(()=>{t.classList.remove("updating")},500)),document.getElementById("previewNumber").textContent=e.length;const n=document.getElementById("exportPreviewCount");ye()?n.querySelector("#previewNumber").className="text-warning updating":n.querySelector("#previewNumber").className="text-primary updating"}function ye(){const e=document.getElementById("exportStatusFilter"),t=document.getElementById("exportClientStatusFilter"),n=document.getElementById("exportSessionTypeFilter"),o=document.getElementById("exportDateFrom").value,s=document.getElementById("exportDateTo").value,a=document.getElementById("exportSearchText").value.trim();return e.selectedOptions.length>0&&e.selectedOptions[0].value!==""||t.selectedOptions.length>0&&t.selectedOptions[0].value!==""||n.selectedOptions.length>0&&n.selectedOptions[0].value!==""||o!==""||s!==""||a!==""}function he(){let e=[...g];const t=document.getElementById("exportStatusFilter"),n=Array.from(t.selectedOptions).map(i=>i.value).filter(i=>i!=="");n.length>0&&(e=e.filter(i=>n.includes(i.status||"Pending")));const o=document.getElementById("exportClientStatusFilter"),s=Array.from(o.selectedOptions).map(i=>i.value).filter(i=>i!=="");s.length>0&&(e=e.filter(i=>{const f=i.clientStatus||i.clientStatus||i["Client Status"]||"Pending";return s.includes(f)}));const a=document.getElementById("exportSessionTypeFilter"),d=Array.from(a.selectedOptions).map(i=>i.value).filter(i=>i!=="");d.length>0&&(e=e.filter(i=>{const f=i["session-type"]||i.sessionType||"";return d.includes(f)}));const l=document.getElementById("exportDateFrom").value,r=document.getElementById("exportDateTo").value;(l||r)&&(e=e.filter(i=>{const f=i["selected-date"]||i.selectedDate;if(!f||f==="N/A")return!1;const p=new Date(f);return!(l&&p<new Date(l)||r&&p>new Date(r))}));const m=document.getElementById("exportSearchText").value.trim().toLowerCase();return m&&(e=e.filter(i=>[i.name||"",i.email||"",i.organization||"",i.phone||"",i["session-type"]||i.sessionType||""].join(" ").toLowerCase().includes(m))),e}function Oe(){const e=he();if(e.length===0){c("No appointments match the selected filters!","warning");return}const t=Ue(),n=bootstrap.Modal.getInstance(document.getElementById("exportFilterModal"));n&&n.hide();const o=window.open("","_blank"),s=new Date().toLocaleDateString(),a=new Date().toLocaleTimeString(),d=He(e,s,a,t);o.document.write(d),o.document.close(),o.onload=function(){setTimeout(()=>{o.print(),c(`PDF export initiated! Exporting ${e.length} appointment(s).`,"success")},500)}}function Ue(){const e={hasFilters:ye(),filters:[]},t=document.getElementById("exportStatusFilter"),n=Array.from(t.selectedOptions).map(i=>i.value).filter(i=>i!=="");n.length>0&&e.filters.push(`Status: ${n.join(", ")}`);const o=document.getElementById("exportClientStatusFilter"),s=Array.from(o.selectedOptions).map(i=>i.value).filter(i=>i!=="");s.length>0&&e.filters.push(`Client Status: ${s.join(", ")}`);const a=document.getElementById("exportSessionTypeFilter"),d=Array.from(a.selectedOptions).map(i=>i.value).filter(i=>i!=="");d.length>0&&e.filters.push(`Session Type: ${d.join(", ")}`);const l=document.getElementById("exportDateFrom").value,r=document.getElementById("exportDateTo").value;if(l||r){let i="Date Range: ";l&&r?i+=`${new Date(l).toLocaleDateString()} to ${new Date(r).toLocaleDateString()}`:l?i+=`From ${new Date(l).toLocaleDateString()}`:i+=`Until ${new Date(r).toLocaleDateString()}`,e.filters.push(i)}const m=document.getElementById("exportSearchText").value.trim();return m&&e.filters.push(`Search: "${m}"`),e}function Ge(){ge()}function He(e,t,n,o=null){const s=e.length,a=e.filter(r=>r.status==="Pending").length,d=e.filter(r=>r.status==="Approved"||r.status==="Session Scheduled").length;let l="";return o&&o.hasFilters&&o.filters.length>0&&(l=`
            <div class="filter-info">
                <h6><i class="fas fa-filter me-2"></i>Applied Filters:</h6>
                <ul>
                    ${o.filters.map(r=>`<li>${r}</li>`).join("")}
                </ul>
            </div>
        `),`
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <title>Appointments Report - ${t}</title>
    <style>
        @page {
            size: A4 landscape;
            margin: 20mm;
        }
        body {
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
            margin: 0;
            padding: 20px;
            font-size: 12px;
            line-height: 1.4;
            color: #333;
        }
        .header {
            text-align: center;
            margin-bottom: 30px;
            border-bottom: 3px solid #0d6efd;
            padding-bottom: 20px;
        }
        .header h1 {
            color: #0d6efd;
            margin: 0;
            font-size: 24px;
            font-weight: 700;
        }
        .header .subtitle {
            color: #666;
            margin: 5px 0;
            font-size: 14px;
        }
        .header .export-info {
            color: #888;
            font-size: 11px;
            margin-top: 10px;
        }
        .summary {
            display: flex;
            justify-content: space-around;
            margin-bottom: 30px;
            background: #f8f9fa;
            padding: 15px;
            border-radius: 8px;
            border: 1px solid #dee2e6;
        }
        .summary-item {
            text-align: center;
            flex: 1;
        }
        .summary-item .number {
            font-size: 20px;
            font-weight: 700;
            color: #0d6efd;
            display: block;
        }
        .summary-item .label {
            font-size: 11px;
            color: #666;
            text-transform: uppercase;
            letter-spacing: 0.5px;
        }
        table {
            width: 100%;
            border-collapse: collapse;
            margin-bottom: 30px;
            background: white;
            box-shadow: 0 2px 8px rgba(0,0,0,0.1);
        }
        th {
            background: linear-gradient(135deg, #0d6efd, #0056b3);
            color: white;
            padding: 12px 8px;
            text-align: left;
            font-weight: 600;
            font-size: 11px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            border: 1px solid #0056b3;
        }
        td {
            padding: 10px 8px;
            border: 1px solid #dee2e6;
            vertical-align: top;
            font-size: 10px;
        }
        tr:nth-child(even) {
            background-color: #f8f9fa;
        }
        tr:hover {
            background-color: #e3f2fd;
        }
        .status-badge {
            padding: 3px 8px;
            border-radius: 12px;
            font-size: 9px;
            font-weight: 600;
            text-align: center;
            color: black;
            display: inline-block;
            min-width: 60px;
        }
        .status-pending { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); }
        .status-approved { background: linear-gradient(135deg, #11998e 0%, #38ef7d 100%); }
        .status-rejected { background: linear-gradient(135deg, #ff416c 0%, #ff4b2b 100%); }
        .status-scheduled { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); }
        .status-other { background: linear-gradient(135deg, #bdc3c7 0%, #2c3e50 100%); }
        .client-info {
            font-weight: 600;
            color: #0d6efd;
        }
        .contact-info {
            font-size: 9px;
            color: #666;
        }
        .date-time {
            font-weight: 600;
            color: #28a745;
        }
        .footer {
            margin-top: 30px;
            padding-top: 20px;
            border-top: 2px solid #dee2e6;
            text-align: center;
            color: #666;
            font-size: 10px;
        }
        .page-break {
            page-break-before: always;
        }
        .filter-info {
            background: #e3f2fd;
            border-left: 4px solid #0d6efd;
            padding: 15px;
            margin-bottom: 20px;
            border-radius: 8px;
        }
        .filter-info h6 {
            color: #0d6efd;
            font-size: 14px;
            font-weight: 700;
            margin: 0 0 10px 0;
        }
        .filter-info ul {
            margin: 0;
            padding-left: 20px;
            list-style-type: circle;
        }
        .filter-info li {
            color: #495057;
            font-size: 11px;
            margin-bottom: 5px;
        }
        @media print {
            body { margin: 0; }
            .no-print { display: none; }
        }
    </style>
</head>
<body>
    <div class="header">
        <h1>📅 Appointment Management Report</h1>
        <div class="subtitle">Comprehensive Appointment Overview</div>
        <div class="export-info">
            Generated on: ${t} at ${n} | 
            Total Records: ${s}
        </div>
    </div>

    ${l}

    <div class="summary">
        <div class="summary-item">
            <span class="number">${s}</span>
            <span class="label">Total Appointments</span>
        </div>
        <div class="summary-item">
            <span class="number">${a}</span>
            <span class="label">Pending</span>
        </div>
        <div class="summary-item">
            <span class="number">${d}</span>
            <span class="label">Approved/Scheduled</span>
        </div>
        <div class="summary-item">
            <span class="number">${e.filter(r=>r.status==="Rejected").length}</span>
            <span class="label">Rejected</span>
        </div>
    </div>

    <table>
        <thead>
            <tr>
                <th style="width: 8%;">S.No.</th>
                <th style="width: 15%;">Client Details</th>
                <th style="width: 18%;">Contact Information</th>
                <th style="width: 12%;">Date & Time</th>
                <th style="width: 12%;">Session Type</th>
                <th style="width: 12%;">Status</th>
                <th style="width: 12%;">Client Status</th>
                <th style="width: 11%;">Submission Date</th>
            </tr>
        </thead>
        <tbody>
            ${e.map((r,m)=>{const i=r.status||"Pending",f=r.clientStatus||r.clientStatus||r["Client Status"]||"Pending",p=r["selected-date"]||r.selectedDate||"N/A",v=r["selected-time"]||r.selectedTime||"N/A",h=r["selected-slot"]||r.selectedSlot||"N/A",w=Y(r,h),E=r["session-type"]||r.sessionType||"N/A",H=r.timestamp||r["Time Stamp *"]||"N/A",F=ne(E);return`
                <tr>
                    <td style="text-align: center; font-weight: 600;">${m+1}</td>
                    <td>
                        <div class="client-info">${r.name||"N/A"}</div>
                        <div style="font-size: 9px; color: #666; margin-top: 2px;">
                            ${r.organization||"No Organization"}
                        </div>
                    </td>
                    <td class="contact-info">
                        <div>📧 ${r.email||"N/A"}</div>
                        <div style="margin-top: 2px;">📞 ${r.phone||"N/A"}</div>
                    </td>
                    <td class="date-time">
                        <div>📅 ${je(p)}</div>
                        <div style="margin-top: 2px;">⏰ ${ze(v)}${w?` ${w}`:""}</div>
                    </td>
                    <td style="text-align: center;">
                        <span style="background: #e3f2fd; padding: 3px 6px; border-radius: 8px; font-size: 9px; color: #1976d2;">
                            ${F}
                        </span>
                    </td>
                    <td style="text-align: center;">
                        <span class="status-badge ${oe(i)}">${i}</span>
                    </td>
                    <td style="text-align: center;">
                        <span class="status-badge ${we(f)}">${f}</span>
                    </td>
                    <td style="font-size: 9px; color: #666;">
                        ${_e(H)}
                    </td>
                </tr>
                `}).join("")}
        </tbody>
    </table>

    <div class="footer">
        <div>🏢 <strong>Anurag Sharma - Consultation Services</strong></div>
        <div style="margin-top: 5px;">
            This report contains confidential information. Please handle with care.
        </div>
        <div style="margin-top: 5px;">
            Report generated automatically by Admin Dashboard System
        </div>
    </div>
</body>
</html>
    `}function je(e){if(e==="N/A")return"Not Set";try{return new Date(e).toLocaleDateString("en-US",{year:"numeric",month:"short",day:"numeric"})}catch{return e}}function ze(e){return e==="N/A"?"Not Set":e}function qe(e){if(!e||e==="N/A")return"";const t=String(e).trim().match(/\d{4}-\d{2}-\d{2}\s+\d{2}:\d{2}(?::\d{2})?\s+(.+)$/);return t?t[1].trim():""}function Y(e,t=""){return e["timezone-selector"]||e.selectedTimezone||e["Selected Timezone"]||qe(t)||""}function _e(e){if(e==="N/A")return"Not Available";try{return new Date(e).toLocaleString("en-US",{year:"numeric",month:"short",day:"numeric",hour:"2-digit",minute:"2-digit"})}catch{return e}}function Qe(){localStorage.removeItem("adminSession"),c("Logged out successfully. Redirecting...","success"),setTimeout(()=>{window.location.href="admin-login.html"},1500)}async function Je(){return new Promise((e,t)=>{const n="jsonpCallback_"+Date.now(),o=document.createElement("script"),s=CONFIG.GOOGLE_SCRIPT_URL+"?action=getAppointments&callback="+n+"&fetchOnly=true&timestamp="+Date.now()+"&adminRequest=true&format=jsonp";window[n]=function(a){console.log("JSONP response received:",a),delete window[n],document.body.removeChild(o),a&&a.status==="success"?(g=a.appointments||[],console.log("Loaded appointments via JSONP:",g.length),g.sort((d,l)=>{const r=m=>{const i=m.timestamp||m["Time Stamp *"]||"";return i?new Date(i).getTime():0};return r(l)-r(d)}),I=[...g],k=1,A(),$(),ve(),P(),q(),y(!1),e(a)):t(new Error(a?.message||"JSONP request failed"))},o.onerror=function(){delete window[n],document.body.removeChild(o),t(new Error("Failed to load script (JSONP error)"))},o.src=s,document.body.appendChild(o),setTimeout(()=>{window[n]&&(delete window[n],document.body.contains(o)&&document.body.removeChild(o),t(new Error("JSONP request timeout")))},15e3)})}async function O(e=0,t=!1){y(!0);try{if(console.log("Loading appointments from:",CONFIG.GOOGLE_SCRIPT_URL),console.log("Attempt:",e+1,"Using JSONP:",t),t)return await Je();const n=await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",cache:"no-cache",credentials:"omit",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:`action=getAppointments&fetchOnly=true&timestamp=${Date.now()}&adminRequest=true`});if(console.log("Response status:",n.status),console.log("Response ok:",n.ok),!n.ok)throw new Error(`HTTP error! status: ${n.status}`);const o=await n.text();console.log("Raw response:",o);let s;try{s=JSON.parse(o)}catch(a){throw console.error("JSON parse error:",a),new Error("Invalid JSON response from server")}if(console.log("Parsed data:",s),s.status==="success")g=s.appointments||[],console.log("Loaded appointments:",g.length),g.sort((a,d)=>{const l=i=>{const f=i.timestamp||i["Time Stamp *"]||"";return f?new Date(f).getTime():0},r=l(a);return l(d)-r}),console.log("Appointments sorted by timestamp (newest first)"),g.slice(0,3).forEach((a,d)=>{console.log(`=== APPOINTMENT ${d+1} DEBUG ===`),console.log("Appointment name:",a.name),console.log("All fields:",Object.keys(a)),console.log("Payment related fields:"),Object.keys(a).forEach(l=>{(l.toLowerCase().includes("payment")||l.toLowerCase().includes("proof")||l.toLowerCase().includes("link"))&&console.log(`  ${l}: "${a[l]}"`)}),console.log("Feedback related fields:"),Object.keys(a).forEach(l=>{(l.toLowerCase().includes("feedback")||l.toLowerCase().includes("client"))&&console.log(`  ${l}: "${a[l]}"`)}),console.log("Client status:",a.clientStatus||a["Client Status"]),console.log("Raw paymentProofLink value:",a.paymentProofLink),console.log("=== END DEBUG ===")}),I=[...g],k=1,A(),$(),ve(),P(),q();else throw new Error(s.message||"Unknown error from server")}catch(n){console.error("Error loading appointments:",n);const o=n.message.includes("Failed to fetch")||n.message.includes("CORS")||n.message.includes("403");if(o)if(e<1){console.log(`CORS/403 error detected, retrying... (attempt ${e+1}/2)`),c(`Connection issue detected. Retrying... (${e+1}/2)`,"info"),setTimeout(()=>{O(e+1,!1)},1500);return}else if(e<2&&!t){console.log("Trying JSONP fallback..."),c("Trying alternative connection method...","info"),setTimeout(()=>{O(e+1,!0)},1e3);return}else console.error("All retry attempts failed"),c(`
                    <strong>Unable to load appointments - CORS/Access Error</strong><br><br>
                    <strong>To fix this, you need to redeploy your Google Apps Script:</strong><br>
                    1. Go to <a href="https://script.google.com" target="_blank">script.google.com</a><br>
                    2. Open your project and click "Deploy" → "New deployment"<br>
                    3. Set "Who has access" to <strong>"Anyone"</strong> (NOT "Anyone with Google account")<br>
                    4. Click Deploy and authorize<br>
                    5. Copy the new URL and update config.js<br><br>
                    <small>See cors-fix-guide.html for detailed instructions</small>
                `,"warning");let s="Failed to load appointments. ";n.message.includes("Failed to fetch")||n.message.includes("403")?s+="The Google Apps Script deployment may need to be updated. Check the console for details.":s+=n.message,o||c(s,"danger"),I=[],k=1,A(),$(),P()}finally{y(!1)}}function Ve(e,t=0){const n=document.getElementById("appointmentsBody");if(n.innerHTML="",e.length===0){n.innerHTML=`
            <tr>
                <td colspan="10" class="empty-state">
                    <i class="fas fa-calendar-times"></i>
                    <p>No appointments found</p>
                </td>
            </tr>
        `;return}e.forEach((s,a)=>{const d=Ye(s),l=We(s,d);n.appendChild(l)}),[...document.querySelectorAll('[data-bs-toggle="tooltip"]')].map(s=>new bootstrap.Tooltip(s)),q()}function q(){const e=document.querySelector(".table-scroll-container"),t=document.getElementById("appointmentsTable");e&&t&&(e.style.overflowX="scroll",t.style.minWidth="1600px",t.style.width="max-content",console.log("Horizontal scrollbar forced via CSS and JS"))}function Ye(e){if(e.rowIndex){const n=g.findIndex(o=>o.rowIndex===e.rowIndex);if(n!==-1)return n}const t=g.findIndex(n=>n.name===e.name&&n.email===e.email&&n.timestamp===e.timestamp);return t!==-1?t:g.findIndex(n=>n.email===e.email&&n.timestamp===e.timestamp)}function We(e,t){const n=document.createElement("tr");n.className="fade-in";const o=e.status||"Pending",s=oe(o),a=e.clientStatus||e.clientStatus||e["Client Status"]||e["client-status"]||"Pending",d=we(a),l=e.clientQuery||e["Client Query"]||e.clientQuery;a==="Query"&&console.log("Query appointment found:",{name:e.name,clientStatus:a,clientQuery:l,hasQuery:!!l,queryLength:l?l.length:0,allQueryFields:{"appointment.clientQuery":e.clientQuery,"Client Query":e["Client Query"],"appointment[clientQuery]":e.clientQuery}}),t<3&&console.log(`Appointment ${t+1} debug:`,{name:e.name,clientStatus:a,allFields:Object.keys(e),clientFields:Object.keys(e).filter(u=>u.toLowerCase().includes("client")||u.toLowerCase().includes("query")||u.toLowerCase().includes("status"))});const r=e["selected-date"]||e.selectedDate||"N/A",m=e["selected-time"]||e.selectedTime||"N/A",i=e["selected-slot"]||e.selectedSlot||"N/A",f=Y(e,i),p=e["session-type"]||e.sessionType||"N/A",v=e.timestamp||e["Time Stamp *"]||"N/A";console.log("=== COMPREHENSIVE DATE/TIME DEBUG ==="),console.log("Full appointment object:",e),console.log("All available fields:",Object.keys(e)),console.log("Date-related fields:"),Object.keys(e).forEach(u=>{(u.toLowerCase().includes("date")||u.toLowerCase().includes("time")||u.toLowerCase().includes("slot")||u.toLowerCase().includes("selected"))&&console.log(`  ${u}: "${e[u]}"`)}),console.log("Selected values:"),console.log(`  selectedDate: "${r}"`),console.log(`  selectedTime: "${m}"`),console.log(`  selectedSlot: "${i}"`),console.log("=== END DEBUG ===");let h=r,w=m;if((h==="N/A"||w==="N/A")&&i!=="N/A"&&(console.log("Extracting date/time from selectedSlot:",i),i.includes(" "))){const u=i.split(" ");u.length>=2&&(h=u[0],w=u[1])}console.log(`Final display values - Date: "${h}", Time: "${w}"`);let E=e.paymentProofLink||e["Payment Proof Link"]||e.paymentProofLink||"";console.log("=== PAYMENT PROOF DEBUG ==="),console.log("Appointment Name:",e.name),console.log("Payment Proof Link field:",E),console.log("Available keys:",Object.keys(e).filter(u=>u.toLowerCase().includes("payment")||u.toLowerCase().includes("proof"))),console.log("=== END PAYMENT PROOF DEBUG ===");const H=u=>{if(console.log("Creating payment proof display for link:",u),!u||u.trim()==="")return'<span class="text-muted"><i class="fas fa-minus"></i> Not uploaded</span>';if(u.includes("=HYPERLINK")){console.log("Detected Google Sheets HYPERLINK formula");const S=u.match(/=HYPERLINK\("([^"]+)",\s*"([^"]+)"\)/);if(S){const D=S[1],L=S[2];console.log("Extracted from HYPERLINK - URL:",D,"Filename:",L);const Ce=L.length>20?L.substring(0,17)+"...":L;return`<a href="${D}" target="_blank" class="btn btn-sm btn-success" 
                          title="View Payment Proof: ${L}" 
                          data-bs-toggle="tooltip" data-bs-placement="top">
                    <i class="fas fa-file-alt"></i> ${Ce}
                </a>`}}if(u.includes("drive.google.com"))return console.log("Detected direct Google Drive URL"),`<a href="${u}" target="_blank" class="btn btn-sm btn-success" 
                      title="View Payment Proof" 
                      data-bs-toggle="tooltip" data-bs-placement="top">
                <i class="fas fa-file-alt"></i> Payment Proof
            </a>`;if(u&&!u.includes("http")&&!u.includes("=HYPERLINK")){console.log("Detected filename without URL:",u);const S=u.length>20?u.substring(0,17)+"...":u;return`<span class="text-warning" 
                      title="File: ${u} (Link missing)" 
                      data-bs-toggle="tooltip" data-bs-placement="top">
                <i class="fas fa-exclamation-triangle"></i> ${S} (Link missing)
            </span>`}return console.log("Using fallback link format"),`<a href="${u}" target="_blank" class="btn btn-sm btn-primary" 
                  title="View Payment Proof" 
                  data-bs-toggle="tooltip" data-bs-placement="top">
            <i class="fas fa-external-link-alt"></i> View Proof
        </a>`},F=document.getElementById("searchInput"),j=F?F.value.trim():"",R=u=>!u||u==="N/A"?u:j?Ft(String(u),j):String(u);return n.innerHTML=`
        <td>
            <div class="session-id-badge" title="${e.sessionId||"N/A"}">
                <strong>${e.sessionId||"N/A"}</strong>
            </div>
        </td>
        <td>
            <div class="session-id-info">
                <div class="timestamp-date">${st(v)}</div>
            </div>
        </td>
        <td>
            <div class="appointment-datetime">
                <div class="appointment-date">${ae(h)}</div>
                <div class="appointment-time">${se(w,f)}</div>
            </div>
        </td>
        <td>
            <div class="client-info">
                <div class="client-name">${R(e.name||"N/A")}</div>
                <div class="client-org">${R(e.organization||"N/A")}</div>
            </div>
        </td>
        <td>
            <div class="contact-info">
                <a href="mailto:${e.email||""}" class="contact-email">${R(e.email||"N/A")}</a>
                <div class="contact-phone">${R(e.phone||"N/A")}</div>
            </div>
        </td>
        <td>
            <span class="session-type">${R(ne(p))}</span>
        </td>
        <td>
            <span class="status-badge ${s}">${R(o)}</span>
        </td>
        <td>
            <span class="client-status-badge ${d}">${R(a)}</span>
            ${a==="Query"&&(e.clientQuery||e["Client Query"]||e.clientQuery)?`<button class="btn btn-sm btn-info mt-1" onclick="showClientQuery('${(e.clientQuery||e["Client Query"]||e.clientQuery||"").replace(/'/g,"&#39;")}', '${e.name}')" title="View Client Query">
                <i class="fas fa-eye"></i> View Query
              </button>`:""}
            ${(a==="Feedback Received"||e.clientFeedback||e["Client Feedback"]||e.clientFeedback)&&(e.clientFeedback||e["Client Feedback"]||e.clientFeedback)?`<button class="btn btn-sm btn-success mt-1" onclick="showClientFeedback('${(e.clientFeedback||e["Client Feedback"]||e.clientFeedback||"").replace(/'/g,"&#39;")}', ${t})" title="View Client Feedback">
                <i class="fas fa-star"></i> View Feedback
                ${a!=="Feedback Received"?' <span class="badge bg-warning">NEW</span>':""}
              </button>`:""} 
              <br>
            ${e.queryHistory||e["Query History"]||e.queryHistory?`<button class="btn btn-sm btn-info mt-1" onclick="showQueryHistory('${(e.queryHistory||e["Query History"]||e.queryHistory||"").replace(/'/g,"&#39;").replace(/\n/g,"\\n")}', '${e.name}')" title="View Query History">
                <i class="fas fa-comments"></i> Query History
              </button>`:""}
            ${e.rescheduleHistory||e["Reschedule History"]||e.rescheduleHistory?`<button class="btn btn-sm btn-warning mt-1" onclick="showRescheduleHistory('${(e.rescheduleHistory||e["Reschedule History"]||e.rescheduleHistory||"").replace(/'/g,"&#39;").replace(/\n/g,"\\n")}', '${e.name}')" title="View Reschedule History">
                <i class="fas fa-history"></i> Reschedule History
              </button>`:""}
        </td>
        <td>
            <div class="payment-proof-info">
                ${H(E)}
            </div>
        </td>
        <td>
            <div class="actions-container">
                ${Xe(e,t,o,a)}
            </div>
        </td>
    `,n}function Ke(e,t){const n=e.clientStatus||e["Client Status"]||"";return n==="Query"?(console.log("Debug - generateQueryResolvedButton for:",e.name),console.log("Debug - clientStatus:",n),`
            <button class="btn btn-sm action-btn btn-success" onclick="showQueryResolvedModal(${t})" title="Mark Query as Resolved">
                <i class="fas fa-question-circle"></i> Resolve Query
            </button>
        `):""}function me(e,t,n="Reschedule"){return`
        <button class="btn btn-sm action-btn btn-reschedule" onclick="showRescheduleModal(${t})" title="${n}">
            <i class="fas fa-calendar-alt"></i>
        </button>
    `}function Xe(e,t,n,o="Pending"){const s=`
        <button class="btn btn-sm action-btn btn-secondary" onclick="viewDetails(${t})" title="View Details">
            <i class="fas fa-eye"></i>
        </button>
    `,a=Ke(e,t),d=()=>["Session Scheduled","Consent Email Sent","Session Reminder Sent"].includes(n)&&n!=="Session Completed",l=()=>n==="Session Scheduled"&&n!=="Session Completed",r=()=>o==="Payment Proof Uploaded"&&!["Session Scheduled","Consent Email Sent","Session Reminder Sent","Session Completed"].includes(n),m=(i=!1,f=!1,p=!1,v=!1)=>{let h="";return h+=a,v?h+=`
                <button class="btn btn-sm action-btn btn-approve" onclick="showApproveModal(${t})" title="Approve">
                    <i class="fas fa-check"></i>
                </button>
                <button class="btn btn-sm action-btn btn-reject" onclick="showRejectModal(${t})" title="Reject">
                    <i class="fas fa-times"></i>
                </button>
            `:n!=="Session Completed"&&(h+=`
                    <button class="btn btn-sm action-btn btn-reject" onclick="showRejectModal(${t})" title="Reject">
                        <i class="fas fa-times"></i>
                    </button>
                `),i&&n!=="Session Completed"&&(h+=`
                <button class="btn btn-sm action-btn btn-payment" onclick="showPaymentModal(${t})" title="Send Invoice">
                    <i class="fas fa-file-invoice-dollar"></i>
                </button>
            `),f&&l()&&(h+=`
                <button class="btn btn-sm action-btn btn-primary" onclick="showSendConsentModal(${t})" title="Send Consent Email">
                    <i class="fas fa-clipboard-check"></i>
                </button>
            `),p&&d()&&(h+=`
                <button class="btn btn-sm action-btn btn-warning" onclick="showSendSessionReminderModal(${t})" title="Send Session Reminder Email">
                    <i class="fas fa-bell"></i>
                </button>
            `),n!=="Session Completed"&&(h+=me(e,t)),n!=="Session Completed"&&(h+=`
                <button class="btn btn-sm action-btn btn-cancel" onclick="showCancelModal(${t})" title="Cancel">
                    <i class="fas fa-ban"></i>
                </button>
            `),h};if(o==="Proceed"){if(n==="Approved")return s+m(!0,!1,!1,!1);if(n==="Session Scheduled")return s+m(!1,!0,!0,!1);if(n==="Query Resolved")return s+m(!0,!1,!1,!1);if(n==="Pending")return s+m(!1,!1,!1,!0)}if(n==="Session Scheduled")return s+m(!1,!0,!0,!1)+`
            <button class="btn btn-sm action-btn btn-refund" onclick="showRefundModal(${t})" title="Initiate Refund">
                <i class="fas fa-money-bill-wave"></i>
            </button>
        `;if(r())return s+m(!0,!1,!1,!1)+`
            <button class="btn btn-sm action-btn btn-success" onclick="showPaymentAcknowledgementModal(${t})" title="Send Payment Acknowledgement">
                <i class="fas fa-video"></i>
            </button>
            <button class="btn btn-sm action-btn btn-refund" onclick="showRefundModal(${t})" title="Initiate Refund">
                <i class="fas fa-money-bill-wave"></i>
            </button>
        `;if(n==="Session Reminder Sent")return s+a+`
            <button class="btn btn-sm action-btn btn-success" onclick="showMarkSessionDoneModal(${t})" title="Mark Session as Done">
                <i class="fas fa-check-circle"></i>
            </button>
            <button class="btn btn-sm action-btn btn-warning" onclick="showSendSessionReminderModal(${t})" title="Send Session Reminder Email">
                <i class="fas fa-bell"></i>
            </button>
            <button class="btn btn-sm action-btn btn-reject" onclick="showRejectModal(${t})" title="Reject">
                <i class="fas fa-times"></i>
            </button>
            ${me(e,t,"Reschedule")}
            <button class="btn btn-sm action-btn btn-cancel" onclick="showCancelModal(${t})" title="Cancel">
                <i class="fas fa-ban"></i>
            </button>
        `;if(o==="Consent Given")return s+m(!1,!1,!0,!1);if(n==="Consent Email Sent")return s+m(!1,!0,!0,!1);if(o&&o.includes("New Time Slot Chosen")||n==="Pending")return s+m(!1,!1,!1,!0);if(n==="Approved")return s+m(!0,!1,!1,!1);if(n==="Payment Sent")return s+m(!0,!1,!1,!1);if(n==="Consent Email Sent")return s+m(!1,!0,!0,!1);if(n==="New Query Received"){let i=!1,f=!1,p=!1,v=!1;return o==="Payment Proof Uploaded"||o==="Proceed"||o.includes("Proceed")?i=!0:o==="Consent Given"?(f=!0,p=!0):(!o||o==="Pending"||o==="Query")&&(v=!1,i=!1),(e["selected-date"]||e.selectedDate||e["selected-time"]||e.selectedTime)&&(f=!0,p=!0),s+m(i,f,p,v)}else return n==="Session Completed"?o==="Feedback Pending"?s+a+`
                <button class="btn btn-sm action-btn btn-primary" onclick="sendFeedbackReminderDirect(${t})" title="Send Feedback Reminder Email">
                    <i class="fas fa-paper-plane"></i>
                </button>
                <span class="badge bg-warning text-dark">
                    <i class="fas fa-clock"></i> Waiting for feedback
                </span>
            `:o==="Feedback Received"?s+a+`
                <span class="badge bg-success">
                    <i class="fas fa-check-circle"></i> Complete
                </span>
            `:s+a+`
                <span class="badge bg-info">
                    <i class="fas fa-check-circle"></i> Completed
                </span>
            `:n==="Rejected"?s+a+`
            <button class="btn btn-sm action-btn btn-success" onclick="showRequestRebookingModal(${t})" title="Request Rebooking">
                <i class="fas fa-calendar-plus"></i>
            </button>
        `:n==="Requested Rebooking"?s+a+`
            <span class="badge bg-info">
                <i class="fas fa-paper-plane"></i> Rebooking Invitation Sent
            </span>
        `:n==="Session Rescheduled"||n==="Rescheduled"?s+m(!0,!0,!0,!1):s+a}function oe(e){return{Pending:"status-pending",Approved:"status-approved",Rejected:"status-rejected","Requested Rebooking":"status-requested-rebooking","Session Rescheduled":"status-rescheduled",Cancelled:"status-cancelled","Payment Sent":"status-payment-sent","Session Scheduled":"status-session-scheduled","Consent Email Sent":"status-consent-sent","Session Reminder Sent":"status-session-reminder-sent","Session Completed":"status-session-completed","Query Resolved":"status-query-resolved"}[e]||"status-pending"}function we(e){const t={Pending:"client-status-pending",Proceed:"client-status-proceed",Query:"client-status-query","Query Resolved - Awaiting Response":"client-status-query-resolved","Payment Proof Uploaded":"client-status-payment-uploaded","Payment Acknowledged":"client-status-payment-uploaded","Consent Given":"client-status-consent-given","Feedback Pending":"client-status-feedback-pending","Feedback Received":"client-status-feedback-received"};return e&&e.includes("Query Resolved")?"client-status-query-resolved":e&&e.includes("Awaiting Response")?"client-status-awaiting-response":e&&e.includes("New Time Slot Chosen")?"client-status-rescheduled":t[e]||"client-status-pending"}function Ze(e,t){try{const n=e.replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,"&"),o=new bootstrap.Modal(document.getElementById("clientQueryModal"));document.getElementById("clientQueryContent").textContent=n||"No query available",document.getElementById("clientQueryModalLabel").textContent=`Client Query - ${t}`,o.show(),console.log("Client query modal opened for:",t)}catch(n){console.error("Error showing client query:",n),alert("Error displaying client query.")}}function et(e,t){try{const n=e.replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,"&").replace(/\\n/g,`
`),o=new bootstrap.Modal(document.getElementById("rescheduleHistoryModal")),s=n.split(`
`).map(a=>a.trim()?`<div class="history-entry"><i class="fas fa-clock text-warning me-2"></i>${a.trim()}</div>`:"").filter(a=>a).join("");document.getElementById("rescheduleHistoryContent").innerHTML=s||'<div class="text-muted">No reschedule history available</div>',document.getElementById("rescheduleHistoryModalLabel").textContent=`Reschedule History - ${t}`,o.show(),console.log("Reschedule history modal opened for:",t)}catch(n){console.error("Error showing reschedule history:",n),alert("Error displaying reschedule history.")}}function tt(e,t){try{const n=e.replace(/&#39;/g,"'").replace(/&quot;/g,'"').replace(/&amp;/g,"&").replace(/\\n/g,`
`),o=new bootstrap.Modal(document.getElementById("queryHistoryModal")),s=n.split(`
`).map(a=>{if(a.trim()){const d=a.includes("submitted query")||a.includes("Query:"),l=a.includes("resolved")||a.includes("Resolution:");let r="fas fa-comment text-info";l?r="fas fa-check-circle text-success":d&&(r="fas fa-question-circle text-warning");let m=a.trim();const i=/\[(Document|Admin Response Document|Client Document|User Document): (https?:\/\/[^\]]+)\]/g;return m=m.replace(i,(f,p,v)=>{let h=p;return v.includes("/d/")&&v.match(/\/d\/([^/]+)/)&&(h=`${p}`),`<a href="${v}" target="_blank" class="btn btn-sm btn-success ms-2" 
                              title="View ${p}" 
                              data-bs-toggle="tooltip" data-bs-placement="top">
                        <i class="fas fa-file-alt"></i> View ${p}
                    </a>`}),`<div class="history-entry mb-2"><i class="${r} me-2"></i>${m}</div>`}return""}).filter(a=>a).join("");document.getElementById("queryHistoryContent").innerHTML=s||'<div class="text-muted">No query history available</div>',document.getElementById("queryHistoryModalLabel").textContent=`Query History - ${t}`,o.show(),console.log("Query history modal opened for:",t)}catch(n){console.error("Error showing query history:",n),alert("Error displaying query history.")}}function nt(e,t){try{const n=g[t];if(!n){console.error("Appointment not found at index:",t),alert("Error: Appointment data not found.");return}const o=new bootstrap.Modal(document.getElementById("clientFeedbackModal")),s=ot(e);document.getElementById("feedbackClientName").textContent=n.name||"Unknown",document.getElementById("feedbackClientEmail").textContent=n.email||"Unknown",document.getElementById("feedbackClientOrg").textContent=n.organization||"Unknown";const a=n["selected-date"]||n.selectedDate||"Unknown",d=n["selected-time"]||n.selectedTime||"Unknown",l=n["selected-slot"]||n.selectedSlot||"Unknown",r=Y(n,l);document.getElementById("feedbackSessionDate").textContent=ae(a),document.getElementById("feedbackSessionTime").textContent=se(d,r),document.getElementById("feedbackSessionType").textContent=ne(n["session-type"]||n.sessionType)||"Consultation",s.rating!=="N/A"?(document.getElementById("feedbackRating").textContent=`${s.rating}/5`,document.getElementById("feedbackStars").innerHTML=s.stars):(document.getElementById("feedbackRating").textContent="No rating",document.getElementById("feedbackStars").innerHTML='<span class="text-muted">No rating provided</span>'),document.getElementById("feedbackContent").textContent=s.text,o.show()}catch(n){console.error("Error showing client feedback:",n),alert("Error displaying feedback details.")}}function ot(e){let t="N/A",n="No feedback available",o="";if(e&&e!=="N/A"){const s=e.match(/Rating:\s*(\d+)\/5\s*stars?\s*\|\s*(.+)/);if(s){t=parseInt(s[1]),n=s[2].trim();for(let a=1;a<=5;a++)a<=t?o+='<i class="fas fa-star text-warning"></i>':o+='<i class="far fa-star text-muted"></i>'}else n=e}return{rating:t,text:n,stars:o}}function st(e){if(e==="N/A")return"N/A";try{const t=new Date(e);return isNaN(t.getTime())?e:t.toLocaleDateString("en-US",{month:"short",day:"numeric",year:"numeric"})+" "+t.toLocaleTimeString("en-US",{hour:"2-digit",minute:"2-digit"})}catch(t){return console.error("Error formatting timestamp:",t,"Original:",e),e}}function be(e){if(!e||e==="N/A")return"N/A";try{if(e.includes("1899-")||e.includes("1900-"))return console.warn("Detected invalid serial time from Google Sheets:",e),"Invalid Time";if(e.includes("-")&&e.match(/\d{1,2}:\d{2}/))return e;if(e.includes("T")&&e.includes(":")){const t=e.split("T")[1];if(t)return t.split(".")[0].substring(0,5)}return e}catch(t){return console.error("Error formatting time:",t,"Original:",e),e}}function se(e,t){const n=be(e);return!t||n==="N/A"||n==="Not Set"?n:`${n} ${t}`}function ae(e){if(!e||e==="N/A")return"N/A";try{let t=e;if(e.includes("1899-")||e.includes("1900-"))return console.warn("Detected invalid serial date from Google Sheets:",e),"Invalid Date";typeof e=="string"&&e.includes(" ")&&(t=e.split(" ")[0]),e.includes("T")&&e.includes("Z")&&(t=e.split("T")[0]);const n=new Date(t);return isNaN(n.getTime())||n.getFullYear()<2020?(console.warn("Invalid or suspicious date detected:",e),e):n.toLocaleDateString("en-US",{weekday:"short",year:"numeric",month:"short",day:"numeric"})}catch(t){return console.error("Error formatting date:",t,"Original:",e),e}}function ve(){const e={pending:0,approved:0,rescheduled:0,rejected:0,sessionScheduled:0};console.log("Debug: All appointment statuses:",g.map(t=>t.status||"Pending")),g.forEach(t=>{switch(t.status||"Pending"){case"Pending":e.pending++;break;case"Approved":e.approved++;break;case"Session Rescheduled":e.rescheduled++;break;case"Rejected":case"Cancelled":e.rejected++;break;case"Session Scheduled":e.sessionScheduled++;break;case"Session Reminder Sent":e.sessionScheduled++;break;case"Payment Sent":e.approved++;break;case"Consent Email Sent":e.approved++;break;case"Session Completed":e.approved++;break}}),console.log("Debug: Calculated stats:",e),document.getElementById("pendingCount").textContent=e.pending,document.getElementById("approvedCount").textContent=e.approved+e.sessionScheduled,document.getElementById("rescheduledCount").textContent=e.rescheduled,document.getElementById("rejectedCount").textContent=e.rejected}function at(e){b=e,new bootstrap.Modal(document.getElementById("approveModal")).show()}function lt(e){b=e,new bootstrap.Modal(document.getElementById("rejectModal")).show()}function it(e){b=e,g[e],ke(),Xt(),Zt(),new bootstrap.Modal(document.getElementById("rescheduleModal")).show()}function rt(e){b=e,new bootstrap.Modal(document.getElementById("cancelModal")).show()}function ct(e){b=e,new bootstrap.Modal(document.getElementById("paymentModal")).show()}function dt(e){b=e,new bootstrap.Modal(document.getElementById("paymentAcknowledgementModal")).show()}function le(e){b=e;const t=g[e],n=document.getElementById("refundModalTitle");if(n){const l=t.name||t["Full Name *"]||"Unknown Client",r=t.sessionId||t["Session ID"]||"Unknown ID";n.textContent=`Initiate Refund - ${l} (${r})`}const o=document.getElementById("refundNotes"),s=document.getElementById("refundProofFile"),a=document.getElementById("refundNotesCount");o&&(o.value=""),s&&(s.value=""),a&&(a.textContent="0"),o&&!o.hasCharCountListener&&(o.addEventListener("input",function(){a&&(a.textContent=this.value.length)}),o.hasCharCountListener=!0),new bootstrap.Modal(document.getElementById("refundModal")).show()}function ut(e){b=e,new bootstrap.Modal(document.getElementById("sendConsentModal")).show()}function mt(e){b=e,new bootstrap.Modal(document.getElementById("sendSessionReminderModal")).show()}function ft(e){b=e,new bootstrap.Modal(document.getElementById("markSessionDoneModal")).show()}function gt(e){b=e,new bootstrap.Modal(document.getElementById("requestRebookingModal")).show()}function pt(e){b=e,document.getElementById("queryResolution").value="";const t=document.getElementById("adminQueryDocument");t&&(t.value=""),new bootstrap.Modal(document.getElementById("queryResolvedModal")).show()}async function yt(){const e=g[b],t=document.getElementById("approveNotes").value;await T("approve",e,{notes:t})}async function ht(){const e=g[b],t=document.getElementById("rejectReason").value.trim();await T("reject",e,{reason:t})}async function wt(){const e=g[b],t=document.getElementById("rescheduleReason").value;await T("reschedule",e,{reason:t})}async function bt(){const e=g[b],t=document.getElementById("cancelReason").value.trim();if(!t){c("Please provide a reason for cancellation.","danger");return}await T("cancel",e,{reason:t})}async function vt(){const e=g[b],t=document.getElementById("invoiceFile"),n=document.getElementById("paymentNotes").value;if(!t.files?.[0]){c("Please select a PDF file to send.","danger");return}const o=t.files[0];if(o.type!=="application/pdf"){c("Please select a valid PDF file.","danger");return}const s=await re(o);await T("payment",e,{notes:n,fileName:o.name,fileContent:s,clientStatus:"P. P Upload Pending",newClientStatus:"P. P Upload Pending","Client Status":"P. P Upload Pending",updateClientStatus:"P. P Upload Pending"})}async function St(){const e=g[b],t=document.getElementById("acknowledgementNotes").value;await T("paymentAcknowledgement",e,{notes:t})}async function Et(){const e=g[b],t=document.getElementById("consentNotes").value;await T("sendConsent",e,{notes:t})}async function kt(){const e=g[b],t=document.getElementById("sessionReminderNotes").value;await T("sendSessionReminder",e,{notes:t})}async function It(e){const t=g[e];confirm(`Send a feedback reminder email to ${t.name||t["Full Name *"]}?`)&&(b=e,await T("sendFeedbackReminder",t,{}))}async function ie(){const e=g[b],t=document.getElementById("refundNotes").value,n=document.getElementById("refundProofFile"),o={notes:t};if(n&&n.files&&n.files[0]){const s=n.files[0];console.log("📎 File selected for refund proof:",{name:s.name,size:s.size,type:s.type,lastModified:new Date(s.lastModified).toISOString()});const a=10*1024*1024;if(s.size>a){c("File size exceeds 10MB limit. Please choose a smaller file.","danger");return}try{console.log("🔄 Converting file to base64...");const d=await re(s);o.refundProofName=s.name,o.refundProofDocument=d,o.refundProofType=s.type,console.log("✅ File converted successfully:",{refundProofName:o.refundProofName,refundProofType:o.refundProofType,base64Length:d.length,hasData:!!o.refundProofDocument})}catch(d){console.error("❌ Error converting file to base64:",d),c("Error processing file. Please try again.","danger");return}}else console.log("ℹ️ No file selected for refund proof");console.log("📤 Sending refund data:",{appointmentId:e.sessionId||e["Session ID"],hasNotes:!!t,hasFile:!!(o.refundProofName&&o.refundProofDocument&&o.refundProofType),refundData:o}),await T("initiateRefund",e,o)}async function Tt(){const e=g[b],t=document.getElementById("sessionDoneNotes").value;await T("markSessionDone",e,{notes:t})}async function Dt(){const e=g[b],t=document.getElementById("rebookingMessage").value.trim();await T("requestRebooking",e,{message:t})}async function xt(){const e=g[b],t=document.getElementById("queryResolution").value.trim();if(!t){c("Please enter your resolution response to the client before submitting.","warning");return}const n=document.getElementById("adminQueryDocument");let o=null;if(n.files&&n.files[0]){const s=n.files[0],a=10*1024*1024;if(s.size>a){c("File size exceeds 10MB limit. Please choose a smaller file.","danger");return}if(!["application/pdf","application/msword","application/vnd.openxmlformats-officedocument.wordprocessingml.document","text/plain","image/jpeg","image/jpg","image/png"].includes(s.type)){c("Invalid file type. Supported formats: PDF, DOC, DOCX, TXT, JPG, PNG","danger");return}try{const l=await re(s);o={fileName:s.name,fileContent:l,fileType:s.type},console.log("Admin document prepared for upload:",s.name,s.type)}catch(l){console.error("Error converting file to base64:",l),c("Error processing file. Please try again.","danger");return}}await T("queryResolved",e,{resolution:t,adminDocument:o})}async function T(e,t,n,o=0){y(!0);try{let s=t.sessionId||t["Session ID"];if(!s&&t.rowIndex){const f=new Date().getFullYear(),p=t.rowIndex-1;s=`GIS-${f}-${String(p).padStart(3,"0")}`,console.log("Constructed Session ID from rowIndex:",s)}s||(console.warn("No Session ID available, using rowIndex as last resort:",t.rowIndex||t.id),s=t.rowIndex||t.id||1),console.log("Final appointmentId being sent to backend:",s);const a={...t,sessionId:s,clientName:t.name||t.clientName,emailAddress:t.email||t.emailAddress,phoneNumber:t.phone||t.phoneNumber||t["Phone Number"],organizationName:t.organization||t.organizationName,clientDesignation:t.designation||t.clientDesignation,appointmentDate:t["selected-date"]||t.selectedDate||t.appointmentDate,appointmentTime:t["selected-time"]||t.selectedTime||t.appointmentTime,sessionType:t["session-type"]||t.sessionType||t.consultationType,consultationTopic:t.topic||t.consultationTopic||t.query,submissionTimestamp:t.timestamp||t["Time Stamp *"]||t.submissionTime,currentStatus:t.status||"Pending",clientCurrentStatus:t.clientStatus||t["Client Status"]||"Pending"},d=["selected-time-slot--in-case-of-consultancyist","selected-time-slot-in-case-of-consultancyregion-st","selected-slot","appointmentDateTime"];for(const f of d)if(t[f]&&t[f]!=="Not specified"){const p=t[f];if(p.includes(" ")){const v=p.split(" ");if(v.length>=2){a.appointmentDate=v[0],a.appointmentTime=v.slice(1).join(" ");break}}}console.log("Sending action:",{action:e,appointmentId:s,enhancedAppointment:a,data:n});const l=new URLSearchParams;l.append("action",e),l.append("appointmentId",s.toString()),l.append("appointment",JSON.stringify(a)),l.append("actionData",JSON.stringify(n)),l.append("timestamp",Date.now().toString());const r=await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",cache:"no-cache",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:l.toString()});if(console.log("Action response status:",r.status),!r.ok)throw new Error(`HTTP error! status: ${r.status}`);const m=await r.text();console.log("Action raw response:",m);let i;try{i=JSON.parse(m)}catch(f){throw console.error("JSON parse error for action response:",f),new Error("Invalid JSON response from server")}if(i.status==="success"){c(`Appointment ${e}d successfully!`,"success");const f=bootstrap.Modal.getInstance(document.querySelector(".modal.show"));f&&f.hide(),ke(),await O()}else throw new Error(i.message||"Unknown error")}catch(s){if(console.error(`Error performing ${e}:`,s),(s.message.includes("Failed to fetch")||s.message.includes("Network request failed")||s.message.includes("Net state changed")||s.message.includes("ERR_NETWORK")||s.name==="TypeError")&&o<3)return console.log(`Network error detected, retrying ${e}... (attempt ${o+1}/3)`),c(`Network issue detected, retrying ${e}... (attempt ${o+1}/3)`,"warning"),await new Promise(d=>setTimeout(d,1e3+o*1e3)),T(e,t,n,o+1);let a=`Failed to ${e} appointment. `;s.message.includes("Failed to fetch")||s.message.includes("Network")?a+="Network connection issue. Please check your internet connection and try again.":s.message.includes("Net state changed")?a+="Network state changed during request. This is usually temporary - please try again.":a+=s.message,c(a,"danger")}finally{y(!1)}}async function Ct(){console.log("Testing connection to Google Apps Script..."),console.log("URL:",CONFIG.GOOGLE_SCRIPT_URL);try{const e=await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"GET",redirect:"follow",cache:"no-cache"});console.log("Test response status:",e.status),console.log("Test response headers:",[...e.headers.entries()]);const t=await e.text();console.log("Test response text:",t),e.ok?c("Connection test successful!","success"):c(`Connection test failed: ${e.status}`,"danger")}catch(e){console.error("Connection test error:",e),c(`Connection test failed: ${e.message}`,"danger")}}function Rt(){const e=document.querySelector(".container-fluid .row").parentElement,t=document.createElement("div");t.innerHTML=`
        <div class="alert alert-info mt-3">
            <strong>Debug Tools:</strong>
            <button class="btn btn-sm btn-primary ms-2" onclick="testConnection()">Test Connection</button>
            <button class="btn btn-sm btn-secondary ms-2" onclick="console.log('Current config:', CONFIG)">Log Config</button>
            <button class="btn btn-sm btn-warning ms-2" onclick="debugAppointmentFields()">Debug Fields</button>
            <button class="btn btn-sm btn-success ms-2" onclick="debugDateTimeFields()">Debug Date/Time</button>
            <button class="btn btn-sm btn-info ms-2" onclick="debugSessionIdColumn()">Debug Session IDs</button>
            <button class="btn btn-sm btn-danger ms-2" onclick="testRefundDocumentUpload()">Test Refund Upload</button>
        </div>
    `,e.appendChild(t)}async function Pt(){console.log("Debugging Session ID column...");try{const e=await fetch(CONFIG.GOOGLE_SCRIPT_URL+"?action=debugSessionId",{method:"GET",redirect:"follow",cache:"no-cache"});if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);const t=await e.json();if(console.log("Session ID Debug Result:",t),t.status==="success"){const n=t;let o=`Session ID Column Debug:
• Column exists: ${n.sessionIdColumnExists}
• Column index: ${n.sessionIdColumnIndex}
• Total rows: ${n.totalRows}
• Sample Session IDs: ${n.sampleSessionIds.map(s=>`Row ${s.row}: ${s.sessionId}`).join(", ")}`;c(o,"info"),n.sessionIdColumnExists?n.sampleSessionIds.some(s=>s.sessionId==="EMPTY")&&c("Some appointments have empty Session IDs. This could cause lookup failures.","warning"):c("Session ID column is missing! This could be causing the approval errors. Consider running the Session ID setup function.","warning")}else c("Debug failed: "+t.message,"danger")}catch(e){console.error("Session ID debug error:",e),c("Failed to debug Session ID column: "+e.message,"danger")}}function Bt(){const e=document.getElementById("searchInput"),t=document.getElementById("searchDropdown"),n=document.getElementById("clearSearch");if(!e||!t||!n){console.warn("Search elements not found in DOM");return}e.addEventListener("input",$t),e.addEventListener("focus",te),e.addEventListener("blur",()=>{setTimeout(z,200)}),t.addEventListener("mousedown",function(o){o.preventDefault()}),t.addEventListener("click",function(o){const s=o.target.closest(".search-option");s&&Se(s.dataset.field)}),n.addEventListener("click",Lt),document.addEventListener("click",function(o){o.target.closest(".search-input-wrapper")||z()}),e.addEventListener("keydown",At)}function $t(e){const t=e.target.value.trim();x=t;const n=document.getElementById("clearSearch");n&&(t?n.style.display="block":n.style.display="none"),clearTimeout(window.searchTimeout),window.searchTimeout=setTimeout(()=>{_()},300)}function At(e){const t=document.getElementById("searchDropdown"),n=t.querySelectorAll(".search-option"),o=t.querySelector(".search-option.active");if(e.key==="ArrowDown"){e.preventDefault(),te();const s=o?o.nextElementSibling:n[0];s&&(o?.classList.remove("active"),s.classList.add("active"))}else if(e.key==="ArrowUp"){e.preventDefault(),te();const s=o?o.previousElementSibling:n[n.length-1];s&&(o?.classList.remove("active"),s.classList.add("active"))}else e.key==="Enter"?(e.preventDefault(),o&&Se(o.dataset.field),z()):e.key==="Escape"&&z()}function te(){const e=document.getElementById("searchDropdown");e&&(e.style.display="block")}function z(){const e=document.getElementById("searchDropdown");e&&(e.style.display="none")}function Se(e){V=e;const t=document.getElementById("searchDropdown");t&&t.querySelectorAll(".search-option").forEach(o=>{o.classList.remove("active"),o.dataset.field===e&&o.classList.add("active")});const n=document.getElementById("searchInput");if(n){const o={all:"Search all fields...",name:"Search by client name...",email:"Search by email...",organization:"Search by organization...",sessionType:"Search by session type...",status:"Search by status..."};n.placeholder=o[e]||"Search appointments..."}x&&_(),z()}function Lt(){const e=document.getElementById("searchInput"),t=document.getElementById("clearSearch");e&&(e.value=""),x="",V="all",t&&(t.style.display="none");const n=document.getElementById("searchDropdown");n&&n.querySelectorAll(".search-option").forEach(o=>{o.classList.remove("active"),o.dataset.field==="all"&&o.classList.add("active")}),e&&(e.placeholder="Search all fields..."),_()}function Nt(e,t,n){if(!t)return e;const o=t.toLowerCase();return e.filter(s=>{const a=d=>{const l=s[d];return l?String(l).toLowerCase():""};switch(n){case"name":return a("name").includes(o);case"email":return a("email").includes(o);case"organization":return a("organization").includes(o);case"sessionType":return(a("session-type")||a("sessionType")).includes(o);case"status":return a("status").includes(o);case"all":default:return a("name").includes(o)||a("email").includes(o)||a("organization").includes(o)||a("phone").includes(o)||(a("session-type")||a("sessionType")).includes(o)||a("status").includes(o)||(a("clientStatus")||a("Client Status")||a("client-status")).includes(o)||(a("selected-date")||a("selectedDate")).includes(o)||(a("selected-time")||a("selectedTime")).includes(o)||(a("selected-slot")||a("selectedSlot")).includes(o)}})}function Ft(e,t){if(!e||!t)return e;const n=String(e),o=String(t),s=new RegExp(`(${o.replace(/[.*+?^${}()|[\]\\]/g,"\\$&")})`,"gi");return n.replace(s,'<mark class="search-highlight">$1</mark>')}function _(){const e=document.getElementById("statusFilter")?.value||"";let t=[...g];e&&(t=t.filter(n=>{const o=n.status||"Pending";return e==="approved-group"?o==="Approved"||o==="Payment Sent"||o==="Session Scheduled"||o==="Session Reminder Sent"||o==="Consent Email Sent"||o==="Session Completed":e==="rejected-group"?o==="Rejected"||o==="Cancelled":o===e})),console.log("Debug: Filter applied:",e),console.log("Debug: Filtered results count:",t.length),console.log("Debug: Filtered appointments:",t.map(n=>({status:n.status,id:n.sessionId}))),x&&x.trim()&&(t=Nt(t,x.trim(),V)),I=t,k=1,A(),$(),P()}function P(){const e=document.getElementById("searchResultsIndicator");if(!e)return;const t=g.length,n=I.length,o=document.getElementById("statusFilter").value;if(x||o){let s=`Showing ${n} of ${t} appointments`;x&&(s+=` <span class="badge bg-secondary ms-2">Search: "${x}"</span>`),o&&(s+=` <span class="badge bg-primary ms-2">Filter: ${o}</span>`),e.innerHTML=`
            <i class="fas fa-info-circle me-2"></i>
            ${s}
            <button type="button" class="btn btn-sm btn-outline-info ms-2" onclick="clearAllFilters()">
                <i class="fas fa-times me-1"></i>Clear All
            </button>
        `,e.style.display="block"}else e.style.display="none"}function Mt(){const e=document.getElementById("searchInput");e&&(e.value=""),x="",V="all";const t=document.getElementById("statusFilter");t&&(t.value="");const n=document.getElementById("clearSearch");n&&(n.style.display="none"),I=[...g],k=1,A(),$(),P(),c("All filters cleared","success")}window.clearAllFilters=Mt;window.logout=Qe;window.loadAppointments=O;window.exportToCSV=Me;window.showExportFilterModal=ge;window.clearExportFilters=pe;window.updateExportPreview=C;window.generateFilteredPDF=Oe;window.showDateManagementModal=Ut;window.downloadLoginHistory=Ie;window.confirmApprove=yt;window.confirmReject=ht;window.confirmReschedule=wt;window.confirmCancel=bt;window.confirmPayment=vt;window.confirmPaymentAcknowledgement=St;window.showRefundModal=le;window.confirmRefund=ie;window.confirmSendConsent=Et;window.confirmSendSessionReminder=kt;window.confirmMarkSessionDone=Tt;window.confirmRequestRebooking=Dt;window.confirmQueryResolved=xt;window.blockDates=Ht;window.loadBlockedDates=G;window.makeMultipleDatesAvailable=_t;window.makeSingleDateAvailable=Qt;window.loadAvailableDates=N;window.removeAvailableDate=Jt;window.unblockEntireRange=jt;window.manualUnblockDate=zt;window.showClientQuery=Ze;window.showClientFeedback=nt;window.showQueryHistory=tt;window.showRescheduleHistory=et;window.showQueryResolvedModal=pt;window.showRescheduleModal=it;window.viewDetails=Wt;window.showPaymentModal=ct;window.showCancelModal=rt;window.showSendConsentModal=ut;window.showPaymentAcknowledgementModal=dt;window.showRefundModal=le;window.confirmRefund=ie;window.showRefundModal=le;window.confirmRefund=ie;window.showApproveModal=at;window.showRejectModal=lt;window.showSendSessionReminderModal=mt;window.showMarkSessionDoneModal=ft;window.showRequestRebookingModal=gt;window.sendFeedbackReminderDirect=It;window.testConnection=Ct;window.debugAppointmentFields=Kt;window.debugDateTimeFields=Yt;async function Ot(){y(!0);try{console.log("Testing refund document upload functionality...");const e=new URLSearchParams;e.append("action","testRefundUpload"),e.append("timestamp",Date.now().toString());const t=await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",cache:"no-cache",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:e.toString()});if(!t.ok)throw new Error(`HTTP error! status: ${t.status}`);const n=await t.text();console.log("Test response:",n);let o;try{o=JSON.parse(n)}catch(s){throw console.error("JSON parse error:",s),new Error("Invalid JSON response from server")}if(o.status==="success")c("✅ Refund document upload test completed successfully! Check the console logs for details.","success"),console.log("Test result:",o);else throw new Error(o.message||"Test failed with unknown error")}catch(e){console.error("Test failed:",e),c("❌ Refund document upload test failed: "+e.message,"danger")}finally{y(!1)}}window.testRefundDocumentUpload=Ot;window.debugSessionIdColumn=Pt;function Ut(){new bootstrap.Modal(document.getElementById("dateManagementModal")).show(),G(),N();const t=new Date().toISOString().split("T")[0];document.getElementById("blockStartDate").min=t,document.getElementById("blockEndDate").min=t;const n=document.getElementById("availableStartDate"),o=document.getElementById("availableEndDate"),s=document.getElementById("singleAvailableDate");n&&(n.min=t),o&&(o.min=t),s&&(s.min=t),Gt()}async function Gt(){try{console.log("Testing connection to Google Apps Script..."),console.log("Using URL:",CONFIG.GOOGLE_SCRIPT_URL);const e=new URLSearchParams;e.append("action","getBlockedDates");const t=await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:e.toString()});if(console.log("Test response status:",t.status),console.log("Test response ok:",t.ok),t.ok){const n=await t.text();console.log("Test response text:",n),console.log("Date management connection test: SUCCESS")}else console.error("Date management connection test: FAILED - Status:",t.status)}catch(e){console.error("Date management connection test: ERROR -",e)}}async function Ht(){const e=document.getElementById("blockStartDate").value,t=document.getElementById("blockEndDate").value,n=document.getElementById("blockReason").value.trim();if(!e){c("Please select a start date","error");return}if(t&&new Date(t)<new Date(e)){c("End date cannot be before start date","error");return}y(!0);try{console.log("Attempting to block dates:",{startDate:e,endDate:t,reason:n}),console.log("Using URL:",CONFIG.GOOGLE_SCRIPT_URL);const o=Ee(e,t||e),s=await qt(),a=o.filter(l=>!s.has(l)),d=o.filter(l=>s.has(l));if(d.length>0&&c(`These dates are already blocked and will be skipped: ${d.join(", ")}`,"info"),a.length===0){c("All selected dates are already blocked. No new dates to block.","warning"),y(!1);return}for(const l of a){const r=new URLSearchParams;r.append("action","blockDates"),r.append("startDate",l),r.append("endDate",l),r.append("reason",n||"Date blocked by admin");const m=await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",cache:"no-cache",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:r.toString()});if(!m.ok)throw new Error(`HTTP error while blocking ${l}: ${m.status}`);const i=await m.text();let f;try{f=JSON.parse(i)}catch{if(i.includes("success")||i.includes("blocked"))f={success:!0};else throw new Error(`Invalid response format while blocking ${l}`)}if(!f.success)throw new Error(f.error||`Could not block date ${l}`)}{let l=`${a.length} date(s) blocked successfully!`;d.length>0&&(l+=` (${d.length} duplicate(s) skipped)`),c(l,"success"),document.getElementById("blockStartDate").value="",document.getElementById("blockEndDate").value="",document.getElementById("blockReason").value="",G(),U()}}catch(o){console.error("Error blocking dates:",o);let s="Network error while blocking dates. ";o.message.includes("Failed to fetch")?s+=`Please check:
• Your internet connection
• The Google Apps Script URL is correct
• The script is properly deployed`:s+=o.message,c(s,"error")}finally{y(!1)}}async function G(){try{console.log("Loading blocked dates from:",CONFIG.GOOGLE_SCRIPT_URL+"?action=getBlockedDates");const e=await fetch(CONFIG.GOOGLE_SCRIPT_URL+"?action=getBlockedDates",{method:"GET",redirect:"follow",cache:"no-cache",headers:{Accept:"application/json"}});if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);const t=await e.text();console.log("Blocked dates raw response:",t);let n;try{n=JSON.parse(t)}catch(o){console.warn("Could not parse blocked dates response as JSON:",o),n={success:!0,data:[]}}return n.success&&n.data?(K(n.data),n.data):(console.error("Error loading blocked dates:",n.error),K([]),[])}catch(e){return console.warn("Error loading blocked dates, showing fallback:",e),K([]),e.message.includes("Failed to fetch")&&c("Unable to load blocked dates. Please check your internet connection and Google Apps Script configuration.","warning"),[]}}function K(e){const t=document.getElementById("blockedDatesList");if(!e||e.length===0){t.innerHTML=`
            <div class="text-center text-muted py-3">
                <i class="fas fa-calendar-check fa-2x mb-2 d-block"></i>
                <div>No blocked dates</div>
            </div>
        `;return}t.innerHTML=e.map(n=>{const o=new Date(n.startDate).toLocaleDateString(),s=n.endDate&&n.endDate!==n.startDate?new Date(n.endDate).toLocaleDateString():null;return`
            <div class="blocked-date-item border-bottom py-2">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="fw-bold text-danger">
                            <i class="fas fa-ban me-1"></i>${s?`${o} - ${s}`:o}
                        </div>
                        <small class="text-muted">${n.reason||"No reason provided"}</small>
                    </div>
                    <div>
                        <button class="btn btn-outline-success btn-sm" onclick="unblockEntireRange('${n.id||n.startDate}')" title="Unblock entire range">
                            <i class="fas fa-unlock me-1"></i>Unblock
                        </button>
                    </div>
                </div>
            </div>
        `}).join("")}async function jt(e){if(confirm("Are you sure you want to unblock this date/range? This will make the date(s) available for booking again.")){y(!0);try{const t=new URLSearchParams;t.append("action","unblockDate"),t.append("dateId",e);const n=await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:t.toString()});if(console.log("Unblock response status:",n.status),!n.ok)throw new Error(`HTTP error! status: ${n.status}`);const o=await n.text();console.log("Unblock raw response:",o);let s;try{s=JSON.parse(o)}catch(a){throw console.error("JSON parse error:",a),new Error("Invalid JSON response from server")}s.success?(c("Date(s) unblocked successfully!","success"),G(),U()):c("Error unblocking date(s): "+(s.error||"Unknown error"),"error")}catch(t){console.error("Error unblocking date:",t),c("Network error while unblocking date. Please check your connection and try again.","error")}finally{y(!1)}}}async function zt(){const e=document.getElementById("unblockDate").value;if(!e){c("Please select a date to unblock.","warning");return}if(confirm(`Are you sure you want to unblock ${new Date(e).toLocaleDateString()}? This will make the date available for booking even if it's part of a blocked range.`)){y(!0);try{const t=new URLSearchParams;t.append("action","manualUnblockDate"),t.append("date",e);const n=await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:t.toString()});if(!n.ok)throw new Error(`HTTP error! status: ${n.status}`);const o=await n.text();let s;try{s=JSON.parse(o)}catch{throw new Error("Invalid JSON response from server")}s.success?(c("Date unblocked successfully!","success"),document.getElementById("unblockDate").value="",G(),U()):c("Error unblocking date: "+(s.error||"Unknown error"),"error")}catch(t){console.error("Error performing manual unblock:",t),c("Network error while unblocking date. Please try again.","error")}finally{y(!1)}}}function B(e){if(!e)return"";if(typeof e=="string"){const a=e.trim();if(/^\d{4}-\d{2}-\d{2}$/.test(a))return a;if(a.includes("T"))return a.split("T")[0]}const t=new Date(e);if(Number.isNaN(t.getTime()))return"";const n=t.getFullYear(),o=String(t.getMonth()+1).padStart(2,"0"),s=String(t.getDate()).padStart(2,"0");return`${n}-${o}-${s}`}function Ee(e,t){const n=new Date(e),o=new Date(t);if(Number.isNaN(n.getTime())||Number.isNaN(o.getTime()))return[];const s=[],a=new Date(n);for(;a<=o;)s.push(B(a)),a.setDate(a.getDate()+1);return s}async function qt(){const e=await G(),t=new Set;return(e||[]).forEach(n=>{if(!n||!n.startDate)return;const o=B(n.startDate),s=B(n.endDate||n.startDate);Ee(o,s).forEach(a=>{a&&t.add(a)})}),t}async function _t(){const e=document.getElementById("availableStartDate").value,t=document.getElementById("availableEndDate").value,n=document.getElementById("availableReason").value.trim();if(!e){c("Please select a start date","error");return}if(t&&new Date(t)<new Date(e)){c("End date cannot be before start date","error");return}y(!0);try{console.log("Attempting to make dates available:",{startDate:e,endDate:t,reason:n});const o=[],s=new Date(e),a=new Date(t||e),d=new Date(s);for(;d<=a;)o.push(B(d)),d.setDate(d.getDate()+1);console.log("Generated dates array:",o);const l=await N(),r=new Set((l||[]).map(w=>B(w.date)).filter(Boolean)),m=o.filter(w=>!r.has(w)),i=o.filter(w=>r.has(w));if(i.length>0){const w=`These dates are already available and will be skipped: ${i.join(", ")}`;console.log(w),c(w,"info")}if(m.length===0){c("All selected dates are already available. No new dates to add.","warning"),y(!1);return}console.log("New dates to add:",m),console.log("Duplicate dates skipped:",i);const f=new URLSearchParams;f.append("action","makeMultipleDatesAvailable"),f.append("dates",JSON.stringify(m)),f.append("reason",n||"Manually made available by admin");const p=await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",cache:"no-cache",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:f.toString()});if(!p.ok)throw new Error(`HTTP error! status: ${p.status}`);const v=await p.text();console.log("Make available dates raw response:",v);let h;try{h=JSON.parse(v)}catch(w){if(console.error("JSON parse error:",w),v.includes("success")||v.includes("available"))h={success:!0,message:"Dates made available successfully"};else throw new Error("Invalid response format")}if(h.success){let w=`${m.length} date(s) made available successfully!`;i.length>0&&(w+=` (${i.length} duplicate(s) skipped)`),c(w,"success"),document.getElementById("availableStartDate").value="",document.getElementById("availableEndDate").value="",document.getElementById("availableReason").value="",N(),U()}else c("Error making dates available: "+(h.error||h.message||"Unknown error"),"error")}catch(o){console.error("Error making dates available:",o);let s="Network error while making dates available. ";o.message.includes("Failed to fetch")?s+="Please check your internet connection and try again.":s+=o.message,c(s,"error")}finally{y(!1)}}async function Qt(){const e=document.getElementById("singleAvailableDate").value,t=document.getElementById("singleAvailableReason").value.trim();if(!e){c("Please select a date to make available.","warning");return}y(!0);try{const n=await N();if(new Set((n||[]).map(r=>B(r.date)).filter(Boolean)).has(B(e))){c("This date is already manually available.","warning"),y(!1);return}const s=new URLSearchParams;s.append("action","makeDateAvailable"),s.append("date",e),s.append("reason",t||"Manually made available by admin");const a=await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:s.toString()});if(!a.ok)throw new Error(`HTTP error! status: ${a.status}`);const d=await a.text();let l;try{l=JSON.parse(d)}catch{throw new Error("Invalid JSON response from server")}l.success?(c("Date made available successfully!","success"),document.getElementById("singleAvailableDate").value="",document.getElementById("singleAvailableReason").value="",N(),U()):c("Error making date available: "+(l.error||"Unknown error"),"error")}catch(n){console.error("Error making single date available:",n),c("Network error while making date available. Please check your connection and try again.","error")}finally{y(!1)}}async function N(){try{console.log("Loading available dates from:",CONFIG.GOOGLE_SCRIPT_URL+"?action=getAvailableDates");const e=await fetch(CONFIG.GOOGLE_SCRIPT_URL+"?action=getAvailableDates",{method:"GET",redirect:"follow",cache:"no-cache",headers:{Accept:"application/json"}});if(!e.ok)throw new Error(`HTTP error! status: ${e.status}`);const t=await e.text();console.log("Available dates raw response:",t);let n;try{n=JSON.parse(t)}catch(o){console.warn("Could not parse available dates response as JSON:",o),n={success:!0,data:[]}}return n.success&&n.data?(X(n.data),n.data):(console.log("No available dates found or error:",n.error),X([]),[])}catch(e){return console.warn("Error loading available dates, showing fallback:",e),X([]),e.message.includes("Failed to fetch")&&c("Unable to load available dates. This feature may require updating your Google Apps Script deployment with the latest available dates functionality.","info"),[]}}function X(e){const t=document.getElementById("availableDatesList");if(!e||e.length===0){t.innerHTML=`
            <div class="text-center text-muted py-3">
                <i class="fas fa-calendar-plus fa-2x mb-2 d-block"></i>
                <div>No manually available dates</div>
                <small>All weekdays (Mon-Fri) are available by default for most sessions.<br>
                Weekends (Sat-Sun) are available by default for Super-Specialized sessions.</small>
                <div class="mt-2">
                    <small class="text-info">
                        <i class="fas fa-info-circle"></i>
                        If you can't add available dates, please ensure your Google Apps Script has been updated with the latest version.
                    </small>
                </div>
            </div>
        `;return}t.innerHTML=e.map(n=>{const o=new Date(n.date).toLocaleDateString(),s=new Date(n.date).toLocaleDateString("en-US",{weekday:"long"}),a=B(n.date);return`
            <div class="available-date-item border-bottom py-2" data-date="${a}">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <div class="fw-bold text-success">
                            <i class="fas fa-calendar-check me-1"></i>${o} (${s})
                        </div>
                        <small class="text-muted">${n.reason||"No reason provided"}</small>
                    </div>
                    <div>
                        <button class="btn btn-outline-danger btn-sm" onclick="removeAvailableDate('${n.id||a}')" title="Remove from available dates">
                            <i class="fas fa-times me-1"></i>Remove
                        </button>
                    </div>
                </div>
            </div>
        `}).join("")}async function Jt(e){if(confirm("Are you sure you want to remove this date from manually available dates? This will revert it to the default availability rules.")){y(!0);try{const t=new URLSearchParams;t.append("action","removeAvailableDate"),t.append("dateId",e);const n=await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:t.toString()});if(!n.ok)throw new Error(`HTTP error! status: ${n.status}`);const o=await n.text();let s;try{s=JSON.parse(o)}catch{throw new Error("Invalid JSON response from server")}s.success?(c("Available date removed successfully!","success"),N(),U()):c("Error removing available date: "+(s.error||"Unknown error"),"error")}catch(t){console.error("Error removing available date:",t),c("Network error while removing available date. Please check your connection and try again.","error")}finally{y(!1)}}}function $(){const e=Math.ceil(I.length/M),t=document.getElementById("paginationControls");if(J(),e<=1){t.innerHTML="";return}let n="";n+=`
        <li class="page-item ${k===1?"disabled":""}">
            <a class="page-link" href="#" onclick="goToPage(${k-1}); return false;">
                <i class="fas fa-chevron-left"></i>
            </a>
        </li>
    `;const o=5;let s=Math.max(1,k-Math.floor(o/2)),a=Math.min(e,s+o-1);a-s+1<o&&(s=Math.max(1,a-o+1)),s>1&&(n+=`
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPage(1); return false;">1</a>
            </li>
        `,s>2&&(n+='<li class="page-item disabled"><span class="page-link">...</span></li>'));for(let d=s;d<=a;d++)n+=`
            <li class="page-item ${d===k?"active":""}">
                <a class="page-link" href="#" onclick="goToPage(${d}); return false;">${d}</a>
            </li>
        `;a<e&&(a<e-1&&(n+='<li class="page-item disabled"><span class="page-link">...</span></li>'),n+=`
            <li class="page-item">
                <a class="page-link" href="#" onclick="goToPage(${e}); return false;">${e}</a>
            </li>
        `),n+=`
        <li class="page-item ${k===e?"disabled":""}">
            <a class="page-link" href="#" onclick="goToPage(${k+1}); return false;">
                <i class="fas fa-chevron-right"></i>
            </a>
        </li>
    `,t.innerHTML=n,J()}function Vt(e){const t=Math.ceil(I.length/M);e<1||e>t||(k=e,A(),$())}window.goToPage=Vt;function J(){I||(I=[]);const e=I.length,t=e>0?(k-1)*M+1:0,n=Math.min(k*M,e);document.getElementById("showingStart").textContent=t,document.getElementById("showingEnd").textContent=n,document.getElementById("totalRecords").textContent=e}function A(){const e=(k-1)*M,t=e+M,n=I.slice(e,t);Ve(n,e),P(),J()}function Yt(){g.length>0?(console.log("=== DATE/TIME FIELDS DEBUG ==="),g.forEach((e,t)=>{console.log(`
--- Appointment ${t+1} ---`),console.log("All fields:"),Object.keys(e).forEach(n=>{const o=e[n];(n.toLowerCase().includes("date")||n.toLowerCase().includes("time")||n.toLowerCase().includes("slot")||n.toLowerCase().includes("selected"))&&console.log(`  ${n}: "${o}" (type: ${typeof o})`)})}),console.log("=== END DATE/TIME DEBUG ==="),c("Check console for detailed date/time field analysis.","info")):c("No appointments available to debug. Load appointments first.","warning")}function ke(){document.getElementById("approveNotes").value="",document.getElementById("rejectReason").value="",document.getElementById("rescheduleReason").value="",document.getElementById("cancelReason").value="",document.getElementById("invoiceFile").value="",document.getElementById("paymentNotes").value="",document.getElementById("acknowledgementNotes").value="",document.getElementById("consentNotes").value="",document.getElementById("sessionReminderNotes").value="",document.getElementById("sessionDoneNotes").value="",document.getElementById("rebookingMessage").value=""}function re(e){return new Promise((t,n)=>{const o=new FileReader;o.readAsDataURL(e),o.onload=()=>t(o.result.split(",")[1]),o.onerror=s=>n(s)})}function y(e){document.getElementById("loadingSpinner").style.display=e?"block":"none"}function c(e,t){let n=document.getElementById("alertContainer");n||(n=document.createElement("div"),n.id="alertContainer",n.className="alert-container",n.style.cssText=`
            position: fixed;
            top: 90px;
            left: 50%;
            transform: translateX(-50%);
            z-index: 10000;
            width: 95%;
            max-width: 650px;
            pointer-events: none;
        `,document.body.appendChild(n));const o=document.createElement("div");o.className=`alert alert-${t} alert-dismissible fade show`,o.style.cssText=`
        pointer-events: auto;
        margin: 0 auto 12px auto;
        border-radius: 12px;
        border: none;
        font-weight: 500;
        animation: gentleSlideIn 0.6s cubic-bezier(0.4, 0.0, 0.2, 1);
        position: relative;
        overflow: hidden;
        backdrop-filter: blur(10px);
        min-height: 60px;
        display: flex;
        align-items: center;
        padding: 1rem 1.5rem;
        width: 100%;
        box-sizing: border-box;
    `;let s="",a="";switch(t){case"success":s="fas fa-check-circle",a=`
                background: linear-gradient(135deg, rgba(25, 135, 84, 0.95), rgba(25, 135, 84, 0.85));
                border-left: 4px solid #198754;
                color: white;
                box-shadow: 0 8px 25px rgba(25, 135, 84, 0.3);
            `;break;case"danger":s="fas fa-exclamation-triangle",a=`
                background: linear-gradient(135deg, rgba(220, 53, 69, 0.95), rgba(220, 53, 69, 0.85));
                border-left: 4px solid #dc3545;
                color: white;
                box-shadow: 0 8px 25px rgba(220, 53, 69, 0.3);
            `;break;case"warning":s="fas fa-exclamation-circle",a=`
                background: linear-gradient(135deg, rgba(255, 193, 7, 0.95), rgba(255, 193, 7, 0.85));
                border-left: 4px solid #ffc107;
                color: #000;
                box-shadow: 0 8px 25px rgba(255, 193, 7, 0.3);
            `;break;case"info":s="fas fa-info-circle",a=`
                background: linear-gradient(135deg, rgba(13, 202, 240, 0.95), rgba(13, 202, 240, 0.85));
                border-left: 4px solid #0dcaf0;
                color: white;
                box-shadow: 0 8px 25px rgba(13, 202, 240, 0.3);
            `;break;default:s="fas fa-bell",a=`
                background: linear-gradient(135deg, rgba(108, 117, 125, 0.95), rgba(108, 117, 125, 0.85));
                border-left: 4px solid #6c757d;
                color: white;
                box-shadow: 0 8px 25px rgba(108, 117, 125, 0.3);
            `}o.style.cssText+=a,o.innerHTML=`
        <div style="display: flex; align-items: center; width: 100%;">
            <i class="${s}" style="font-size: 1.2rem; margin-right: 12px; opacity: 0.9;"></i>
            <span style="flex: 1; line-height: 1.4;">${e}</span>
            <button type="button" class="btn-close btn-close-white" style="margin-left: 15px; opacity: 0.8;" aria-label="Close"></button>
        </div>
    `;const d=document.createElement("div");d.style.cssText=`
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 2px;
        background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.8), transparent);
        animation: shimmer 2s ease-in-out infinite;
    `,o.appendChild(d),n.appendChild(o),o.addEventListener("mouseenter",()=>{o.style.transform="translateY(-2px) scale(1.02)",o.style.boxShadow=o.style.boxShadow.replace("0.3)","0.4)")}),o.addEventListener("mouseleave",()=>{o.style.transform="translateY(0) scale(1)",o.style.boxShadow=o.style.boxShadow.replace("0.4)","0.3)")});const l=setTimeout(()=>{m(o)},8e3);o.querySelector(".btn-close").addEventListener("click",()=>{clearTimeout(l),m(o)});function m(i){i.parentNode&&(i.style.animation="gentleSlideOut 0.5s cubic-bezier(0.4, 0.0, 0.2, 1) forwards",i.style.pointerEvents="none",setTimeout(()=>{i.parentNode&&i.remove()},500))}}function Wt(e){const t=g[e],n=(u,S=null)=>{for(const D of u)if(t[D]&&t[D]!=="")return t[D];return S},o=n(["session-type","sessionType"],""),s=o.toLowerCase();let a="generalized";s.includes("super-specialized")?a="super-specialized":s.includes("specialized")?a="specialized":(s.includes("long-term")||s.includes("long_term"))&&(a="long-term-engagement");const d=[{field:"topic",label:"What do you want to talk about? * Please ask your question in 50-100 words."},{field:"selected-domains",label:"Domain Selected"},{field:"custom-domain-input",label:"Custom Domain (if Others selected)"},{field:"selected-regions",label:"Region Selected"},{field:"custom-region-domain-input",label:"Custom Region (if Others selected)"},{field:"location",label:"Location/Region"}],r={generalized:{title:"Generalized Session",questions:[...d,{field:"space-policy-area",label:"What specific area of space policy interests you most?"},{field:"guidance-type",label:"Are you looking for general guidance or specific insights?"},{field:"specific-insights-details",label:"If Specific insights, Details"}]},specialized:{title:"Specialized Session (Virtual)",questions:[...d,{field:"policy-directive",label:"Is there any policy directive you are concerned with?"},{field:"policy-directive-details",label:"If Yes, Policy Directive Details"},{field:"geopolitical-situation",label:"Is there any specific Geopolitical development/ situation you are concerned with?"},{field:"geopolitical-details",label:"If Yes, Geopolitical Development/Situation Details"},{field:"use-case",label:'Is there any particular "Use Case" related to your work profile/project you are concerned with?'},{field:"use-case-details",label:"If Yes, Use Case Details"},{field:"additional-info",label:"Is there any other specific information you would like to discuss before the consultancy session to make the session more personalized?"},{field:"additional-info-details",label:"If Yes, Additional Information Details"},{field:"specific-entity",label:"Is there any specific Entity you are already dealing with?"},{field:"entity-details",label:"If Yes, Entity Details"},{field:"detail-level",label:"What level of detail are you expecting from this consultation?"}]},"super-specialized":{title:"Super-Specialized Session (In-Person)",questions:[...d,{field:"complex-challenges",label:"What complex challenges or strategic decisions are you currently facing?"},{field:"relevant-regional-dynamics",label:"Which regional dynamics are most relevant to your current situation?"},{field:"analysis-type",label:"Are you looking for comprehensive analysis or strategic planning assistance?"},{field:"customized-frameworks",label:"Do you need customized frameworks or policy recommendations?"}]},"long-term-engagement":{title:"Long-term Projects",questions:[...d,{field:"strategic-objectives",label:"What are your primary strategic objectives for this engagement?"},{field:"expected-outcomes",label:"Which specific outcomes are you hoping to achieve over the 2-6 month period?"},{field:"engagement-model",label:"What is your preferred engagement model (weekly/bi-weekly consultations)?"},{field:"deliverables-needed",label:"Do you need deliverables like reports, frameworks, or policy recommendations?"}]}}[a],m=(u,S="text")=>{if(!u)return null;switch(S){case"email":return`<a href="mailto:${u}" class="important">${u}</a>`;case"phone":return`<a href="tel:${u}" class="important">${u}</a>`;case"date":return ae(u);case"time":return be(u);case"status":return`<span class="detail-status-badge ${oe(u)}">${u}</span>`;case"text-important":return`<span class="important">${u}</span>`;default:return u}},f=(()=>{const u={};return u.name=n(["name"]),u.email=n(["email"]),u.phone=n(["phone"]),u.organization=n(["organization"]),u.designation=n(["designation"]),u.topic=n(["topic"]),u.status=n(["status"],"Pending"),u.clientStatus=n(["clientStatus","Client Status"],"Pending"),u.timestamp=n(["timestamp","Time Stamp *"]),r.questions&&r.questions.forEach(S=>{u[S.field]=n([S.field])}),u})(),p=n(["selected-slot","selectedSlot"],""),v=Y(t,p);let h=n(["selected-date","selectedDate"]),w=n(["selected-time","selectedTime"]);w=se(w,v);const E=(u,S,D="text",L="")=>S?`<div class="detail-field ${L}"><label class="detail-label">${u}</label><p class="detail-value">${m(S,D)}</p></div>`:"",H=()=>{if(!r.questions)return"";let u="";return r.questions.forEach(S=>{const D=f[S.field];D&&D.trim()!==""&&(u+=E(S.label,D,"text","session-specific"))}),u?`<div class="detail-section session-questions"><h6 class="detail-section-title"><i class="fas fa-question-circle"></i> Session-Specific Information</h6>${u}</div>`:""},F=`
        <div class="modal fade appointment-details-modal" id="detailsModal" tabindex="-1" aria-labelledby="detailsModalLabel" aria-hidden="true">
            <div class="modal-dialog modal-lg">
                <div class="modal-content">
                    <div class="modal-header">
                        <h5 class="modal-title" id="detailsModalLabel"><i class="fas fa-calendar-check"></i> ${r.title}</h5>
                        <button type="button" class="btn-close btn-close-white" data-bs-dismiss="modal" aria-label="Close"></button>
                    </div>
                    <div class="modal-body">
                        <div class="detail-section">
                            <div class="detail-section-header"><i class="fas fa-user-circle"></i><h6>Client Information</h6></div>
                            <div class="detail-grid-3">
                                ${E("Full Name",f.name,"text-important")}
                                ${E("Email Address",f.email,"email")}
                                ${E("Phone Number",f.phone,"phone")}
                                ${E("Organization",f.organization)}
                                ${E("Designation",f.designation)}
                            </div>
                        </div>
                        ${H()}
                        <div class="detail-section">
                            <div class="detail-section-header"><i class="fas fa-calendar-alt"></i><h6>Appointment & Status</h6></div>
                            <div class="detail-row">
                                ${E("Date",h,"date")}
                                ${E("Time",w,"text")}
                                ${E("Timezone",v,"text-important")}
                                ${E("Session Type",o,"text-important")}
                                ${E("Status",f.status,"status")}
                            </div>
                            ${f.clientStatus!=="Pending"?E("Client Status",f.clientStatus,"text-important"):""}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    `,j=document.getElementById("detailsModal");j&&j.remove(),document.body.insertAdjacentHTML("beforeend",F),new bootstrap.Modal(document.getElementById("detailsModal")).show(),document.getElementById("detailsModal").addEventListener("hidden.bs.modal",function(){this.remove()})}function Kt(){if(g.length>0){const e=g[0];console.log("=== APPOINTMENT FIELD DEBUG ==="),console.log("All available fields in first appointment:"),Object.keys(e).forEach(t=>{console.log(`${t}: ${e[t]}`)}),console.log("=== END DEBUG ==="),c(`Check console for detailed field mapping. First appointment has ${Object.keys(e).length} fields.`,"info")}else c("No appointments available to debug. Load appointments first.","warning")}function Xt(){document.getElementById("rescheduleReason").value=""}function Zt(){console.log("Reschedule modal initialized - only request option available")}async function Ie(){try{y(!0);const e=new URLSearchParams;e.append("action","getLoginHistory"),e.append("timestamp",Date.now().toString());const t=await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",cache:"no-cache",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:e.toString()});if(!t.ok)throw new Error(`HTTP error! status: ${t.status}`);const n=await t.json();if(n.status==="success"&&n.data){const s=[["Timestamp","Admin User","IP Address","Browser Info","Login Status"].join("	"),...n.data.map(r=>r.map(m=>String(m||"")).join("	"))].join(`
`),a=new Blob([s],{type:"application/vnd.ms-excel;charset=utf-8;"}),d=document.createElement("a"),l=URL.createObjectURL(a);d.setAttribute("href",l),d.setAttribute("download",`admin_login_history_${new Date().toISOString().slice(0,10)}.xls`),d.style.visibility="hidden",document.body.appendChild(d),d.click(),document.body.removeChild(d),c("Login history downloaded successfully!","success")}else throw new Error(n.message||"Failed to fetch login history")}catch(e){console.error("Error downloading login history:",e),c("Error downloading login history. Please try again.","danger")}finally{y(!1)}}window.addEventListener("resize",function(){clearTimeout(window.resizeTimeout),window.resizeTimeout=setTimeout(()=>{document.getElementById("appointmentsTable")&&q()},250)});document.addEventListener("DOMContentLoaded",function(){const e=new MutationObserver(function(n){n.forEach(function(o){o.type==="childList"&&o.target.id==="appointmentsBody"&&o.addedNodes.length>0&&setTimeout(()=>q(),100)})}),t=document.getElementById("appointmentsBody");t&&e.observe(t,{childList:!0})});function en(){new bootstrap.Modal(document.getElementById("actionsGuideModal")).show()}function ce(){new bootstrap.Modal(document.getElementById("loginHistoryModal")).show();const t=document.getElementById("refreshLoginHistoryBtn"),n=document.getElementById("downloadLoginHistoryBtn");t&&!t.hasAttribute("data-listener-attached")&&(t.addEventListener("click",De),t.setAttribute("data-listener-attached","true")),n&&!n.hasAttribute("data-listener-attached")&&(n.addEventListener("click",Ie),n.setAttribute("data-listener-attached","true")),de()}window.showLoginHistoryModal=ce;async function de(){const e=document.getElementById("loginHistoryLoading"),t=document.getElementById("loginHistoryError");document.getElementById("loginHistoryBody");const n=document.getElementById("loginHistoryCount");e.style.display="block",t.style.display="none";try{const o=new URLSearchParams;o.append("action","getLoginHistory"),o.append("timestamp",Date.now().toString());const s=await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",cache:"no-cache",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:o.toString()});if(!s.ok)throw new Error(`HTTP error! status: ${s.status}`);const a=await s.json();if(a.status==="success"&&a.data)Te(a.data),n.textContent=`${a.data.length} records`;else throw new Error(a.message||"Failed to load login history")}catch(o){console.error("Error loading login history:",o),t.style.display="block",document.getElementById("loginHistoryErrorText").textContent="Unable to load login history: "+o.message,tn()}finally{e.style.display="none"}}function tn(){document.getElementById("loginHistoryBody");const e=document.getElementById("loginHistoryCount");try{const t=JSON.parse(localStorage.getItem("loginHistory")||"[]");if(t.length>0){const n=t.map(o=>[o.timestamp||o.loginDate+" "+o.loginTime,o.email||"Unknown",o.ipAddress||"Unknown",o.browserInfo||o.userAgent?.substring(0,50)+"..."||"Unknown",o.userType||"Login"]).reverse();Te(n),e.textContent=`${n.length} records (local)`}}catch(t){console.error("Error loading local login history:",t)}}function Te(e){const t=document.getElementById("loginHistoryBody");if(!e||e.length===0){t.innerHTML=`
            <tr>
                <td colspan="5" class="text-center text-muted py-4">
                    <i class="fas fa-history fa-2x mb-2"></i>
                    <p>No login history available</p>
                </td>
            </tr>
        `;return}const n=[...e].reverse();t.innerHTML=n.map((o,s)=>{const a=o[0]||"Unknown",d=o[1]||"Unknown",l=o[2]||"Unknown",r=o[3]||"Unknown",m=o[4]||"Success";let i=a;try{const p=new Date(a);isNaN(p.getTime())||(i=p.toLocaleString())}catch{}let f="bg-success";return m.toLowerCase().includes("fail")?f="bg-danger":m.toLowerCase().includes("dashboard")&&(f="bg-info"),`
            <tr>
                <td><small>${i}</small></td>
                <td><span class="fw-medium">${d}</span></td>
                <td><code class="text-primary">${l}</code></td>
                <td><small class="text-muted">${r.substring(0,40)}${r.length>40?"...":""}</small></td>
                <td><span class="badge ${f}">${m}</span></td>
            </tr>
        `}).join("")}function De(){de(),c("Login history refreshed","info")}function xe(){if(!Z()){c("Access Denied: Only Super Admin and Admin roles can manage credentials","danger");return}new bootstrap.Modal(document.getElementById("manageCredentialsModal")).show(),ue(),on()}async function ue(){try{y(!0);const e=new URLSearchParams;e.append("action","getUsersAndRoles"),e.append("timestamp",Date.now().toString());const n=await(await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",cache:"no-cache",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:e.toString()})).json();if(n.status==="success"&&n.data)nn(n.data);else throw new Error(n.message||"Failed to fetch admin accounts")}catch(e){console.error("Error loading admin accounts:",e),c("Failed to load admin accounts. Please try again.","danger")}finally{y(!1)}}function nn(e){const t=document.getElementById("adminAccountsList");if(e.length===0){t.innerHTML='<p class="text-muted text-center">No admin accounts found.</p>';return}t.innerHTML=e.map(n=>`
        <div class="card mb-2">
            <div class="card-body p-3">
                <div class="d-flex justify-content-between align-items-start">
                    <div class="flex-grow-1">
                        <h6 class="mb-1">
                            <i class="fas fa-user me-2"></i>${n.name}
                            <span class="badge bg-${n.role==="Super Admin"?"danger":n.role==="Admin"?"primary":n.role==="User"?"info":"secondary"} ms-2">${n.role}</span>
                        </h6>
                        <small class="text-muted d-block"><i class="fas fa-envelope me-1"></i>${n.email}</small>
                        <small class="text-muted d-block"><i class="fas fa-id-badge me-1"></i>ID: ${n.id}</small>
                        <small class="text-muted d-block"><i class="fas fa-clock me-1"></i>Created: ${n.createdAt?new Date(n.createdAt).toLocaleString():"N/A"}</small>
                        ${n.lastLogin?`<small class="text-muted d-block"><i class="fas fa-sign-in-alt me-1"></i>Last login: ${new Date(n.lastLogin).toLocaleString()}</small>`:""}
                        ${n.passwordChangedBy?`<small class="text-muted d-block"><i class="fas fa-key me-1"></i>Password changed by: ${n.passwordChangedBy}</small>`:""}
                        ${n.passwordChangedAt?`<small class="text-muted d-block"><i class="fas fa-calendar me-1"></i>Password changed: ${n.passwordChangedAt}</small>`:""}
                    </div>
                    <div class="d-flex flex-column gap-2">
                        <button class="btn btn-sm btn-outline-warning" onclick="showChangePasswordModal('${n.id}', '${n.name.replace(/'/g,"\\'")}', '${n.email}')" 
                                title="Change password">
                            <i class="fas fa-key"></i>
                        </button>
                        <button class="btn btn-sm btn-outline-danger" onclick="deleteAdmin('${n.id}')" 
                                ${e.length===1?"disabled":""} 
                                title="${e.length===1?"Cannot delete the last user":"Delete user"}">
                            <i class="fas fa-trash"></i>
                        </button>
                    </div>
                </div>
            </div>
        </div>
    `).join("")}function on(){const e=document.getElementById("addAdminForm"),t=e.cloneNode(!0);e.parentNode.replaceChild(t,e),t.addEventListener("submit",async function(n){n.preventDefault();const o=document.getElementById("newAdminEmail").value,s=document.getElementById("newAdminName").value,a=document.getElementById("newAdminPassword").value,d=document.getElementById("newAdminRole").value;if(!o||!o.includes("@")){c("Please enter a valid email address","danger");return}try{y(!0);const l=new URLSearchParams;l.append("action","addUser"),l.append("email",o),l.append("name",s),l.append("password",a),l.append("role",d),l.append("timestamp",Date.now().toString());const m=await(await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",cache:"no-cache",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:l.toString()})).json();if(m.status==="success")t.reset(),await ue(),c("Admin account added successfully","success");else throw new Error(m.message||"Failed to add admin")}catch(l){console.error("Error adding admin:",l),c(l.message||"Failed to add admin account. Please try again.","danger")}finally{y(!1)}})}async function sn(e){if(confirm("Are you sure you want to delete this admin account?"))try{y(!0);const t=new URLSearchParams;t.append("action","deleteUser"),t.append("userId",e),t.append("timestamp",Date.now().toString());const o=await(await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",cache:"no-cache",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:t.toString()})).json();if(o.status==="success")await ue(),c("Admin account deleted successfully","success");else throw new Error(o.message||"Failed to delete admin")}catch(t){console.error("Error deleting admin:",t),c(t.message||"Failed to delete admin account. Please try again.","danger")}finally{y(!1)}}function an(e,t,n){document.getElementById("changePasswordUserId").value=e,document.getElementById("changePasswordUserName").textContent=t,document.getElementById("changePasswordUserEmail").textContent=n,document.getElementById("changePasswordForm").reset(),new bootstrap.Modal(document.getElementById("changePasswordModal")).show();const s=document.getElementById("changePasswordForm");s.hasAttribute("data-listener-attached")||(s.addEventListener("submit",ln),s.setAttribute("data-listener-attached","true"))}async function ln(e){e.preventDefault();const t=document.getElementById("changePasswordUserId").value,n=document.getElementById("newPassword").value,o=document.getElementById("confirmPassword").value;if(n!==o){c("Passwords do not match!","danger");return}if(n.length<3){c("Password must be at least 3 characters long","danger");return}try{y(!0);const s=new URLSearchParams;s.append("action","changeUserPassword"),s.append("userId",t),s.append("newPassword",n);const d=JSON.parse(localStorage.getItem("adminSession")||"{}").email||"Unknown";s.append("changedByEmail",d),s.append("timestamp",Date.now().toString());const r=await(await fetch(CONFIG.GOOGLE_SCRIPT_URL,{method:"POST",redirect:"follow",cache:"no-cache",headers:{"Content-Type":"application/x-www-form-urlencoded"},body:s.toString()})).json();if(r.status==="success")bootstrap.Modal.getInstance(document.getElementById("changePasswordModal")).hide(),c("Password updated successfully!","success");else throw new Error(r.message||"Failed to change password")}catch(s){console.error("Error changing password:",s),c(s.message||"Failed to change password. Please try again.","danger")}finally{y(!1)}}window.showLoginHistoryModal=ce;window.loadLoginHistory=de;window.refreshLoginHistory=De;window.showManageCredentialsModal=xe;window.deleteAdmin=sn;window.showChangePasswordModal=an;
