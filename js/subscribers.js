const SUBSCRIBERS_API_URL = "https://script.google.com/macros/s/AKfycbziql2bqL-_Ha_6s8jhIAtZc_Sb-kHSS8v50jBwp8JXwMtSnVR-0Z88V_FAujHdYPdnJA/exec";
const token=()=>sessionStorage.getItem("alpfaAdminSession");
const el=id=>document.getElementById(id);
let subscribers=[];
async function request(action,extra={}){
 const response=await fetch(SUBSCRIBERS_API_URL,{method:"POST",headers:{"Content-Type":"text/plain;charset=utf-8"},body:JSON.stringify({action,sessionToken:token(),...extra})});
 const data=await response.json();
 if(data.authenticated===false){sessionStorage.removeItem("alpfaAdminSession");location.replace("login.html");throw Error("Session expired.");}
 return data;
}
function message(s){el("message").textContent=s;}
function render(){
 const query=el("searchInput").value.trim().toLowerCase();
 const shown=subscribers.filter(s=>(s.name+" "+s.email).toLowerCase().includes(query));
 el("activeCount").textContent=`(${subscribers.filter(s=>s.status.toLowerCase()==="active").length} active / ${subscribers.length} total)`;
 const tbody=el("subscriberRows");tbody.replaceChildren();
 for(const s of shown){const tr=document.createElement("tr");
 for(const val of [s.name,s.email,s.status]){const td=document.createElement("td");td.textContent=val;tr.append(td);}
 const td=document.createElement("td");
 if(s.status.toLowerCase()==="active"){const btn=document.createElement("button");btn.className="sub-remove";btn.textContent="Unsubscribe";btn.addEventListener("click",()=>remove(s));td.append(btn);}else{td.textContent="—";}
 tr.append(td);tbody.append(tr);}
 if(!shown.length){const tr=document.createElement("tr"),td=document.createElement("td");td.colSpan=4;td.textContent="No subscribers found.";tr.append(td);tbody.append(tr);}
}
async function load(){message("Loading subscribers...");try{const r=await request("getSubscribersAdmin");if(!r.success)throw Error(r.message||"Unable to load subscribers.");subscribers=r.subscribers||[];render();message("");}catch(e){message(e.message);}}
async function remove(s){if(!confirm(`Unsubscribe ${s.email}? They will no longer receive newsletters.`))return;message("Updating...");try{const r=await request("removeSubscriberAdmin",{subscriberId:s.id});if(!r.success)throw Error(r.message||"Unable to unsubscribe.");await load();message(r.message);}catch(e){message(e.message);}}
document.addEventListener("DOMContentLoaded",async()=>{
 if(!token()){location.replace("login.html");return;}
 try{const r=await request("validateSession");if(!r.success||!r.authenticated){location.replace("login.html");return;}el("dashboardLoading").style.display="none";el("dashboardApp").hidden=false;await load();}catch(e){if(!token())return;el("dashboardLoading").hidden=true;el("dashboardApp").hidden=false;message("Unable to verify session. Check your connection and refresh.");}
 el("searchInput").addEventListener("input",render);
 el("refreshButton").addEventListener("click",load);
 el("logoutButton").addEventListener("click",()=>{sessionStorage.removeItem("alpfaAdminSession");location.replace("login.html");});
 el("addForm").addEventListener("submit",async e=>{e.preventDefault();const btn=el("addButton");btn.disabled=true;message("Saving...");try{const r=await request("addSubscriberAdmin",{name:el("newName").value,email:el("newEmail").value});if(!r.success)throw Error(r.message||"Unable to add subscriber.");el("addForm").reset();await load();message(r.message);}catch(err){message(err.message);}finally{btn.disabled=false;}});
});
