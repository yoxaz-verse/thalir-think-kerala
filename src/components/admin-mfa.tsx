"use client";
import {useState} from "react";
import Image from "next/image";
import {createClient} from "@/lib/supabase/client";

export function AdminMfa({locale}:{locale:"en"|"ml"}){
  const [factorId,setFactorId]=useState(""); const [qr,setQr]=useState(""); const [code,setCode]=useState(""); const [message,setMessage]=useState("");
  async function enroll(){const client=createClient();const {data,error}=await client.auth.mfa.enroll({factorType:"totp",friendlyName:"Thalir Admin"});if(error){setMessage(error.message);return}setFactorId(data.id);setQr(data.totp.qr_code);}
  async function verify(){const client=createClient();const challenge=await client.auth.mfa.challenge({factorId});if(challenge.error){setMessage(challenge.error.message);return}const result=await client.auth.mfa.verify({factorId,challengeId:challenge.data.id,code});if(result.error){setMessage(result.error.message);return}location.reload();}
  return <section className="app-panel app-narrow"><p className="eyebrow">Admin security</p><h1>{locale==="en"?"Multi-factor authentication required":"മൾട്ടി-ഫാക്ടർ ഓതന്റിക്കേഷൻ ആവശ്യമാണ്"}</h1><p>{locale==="en"?"Admin data remains locked until this session reaches AAL2. Enrol a TOTP authenticator or complete your existing factor.":"ഈ സെഷൻ AAL2 കൈവരിക്കുന്നതുവരെ അഡ്മിൻ ഡാറ്റ ലോക്ക് ചെയ്തിരിക്കും. TOTP ഓതന്റിക്കേറ്റർ എൻറോൾ ചെയ്യുക."}</p>{!factorId?<button className="button" onClick={enroll}>{locale==="en"?"Set up authenticator":"ഓതന്റിക്കേറ്റർ സജ്ജമാക്കുക"}</button>:<div className="app-form"><Image src={qr} alt="TOTP QR code" width={220} height={220} unoptimized/><label>{locale==="en"?"Six-digit code":"ആറ് അക്ക കോഡ്"}<input inputMode="numeric" autoComplete="one-time-code" value={code} onChange={e=>setCode(e.target.value)} pattern="[0-9]{6}"/></label><button className="button" onClick={verify}>{locale==="en"?"Verify and continue":"പരിശോധിച്ച് തുടരുക"}</button></div>}{message&&<p className="app-alert">{message}</p>}</section>
}
