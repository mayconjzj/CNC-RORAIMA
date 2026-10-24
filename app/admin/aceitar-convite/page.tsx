"use client";
import { useEffect, useState, type FormEvent } from "react";
import Link from "next/link";
import { ShieldCheck } from "lucide-react";
import { createAuthClient } from "@neondatabase/auth/next";
import styles from "./accept-invite.module.css";

const authClient = createAuthClient();
export default function AcceptInvitePage() {
 const [token,setToken]=useState("");
 const [email,setEmail]=useState(""); const [name,setName]=useState(""); const [password,setPassword]=useState(""); const [confirm,setConfirm]=useState("");
 const [loading,setLoading]=useState(true); const [valid,setValid]=useState(false); const [busy,setBusy]=useState(false); const [error,setError]=useState(""); const [done,setDone]=useState(false);
 useEffect(()=>{let active=true;const currentToken=new URLSearchParams(window.location.search).get("token")??"";setToken(currentToken);async function check(){try{const r=await fetch("/api/admin/invitations/accept?token="+encodeURIComponent(currentToken),{cache:"no-store"});const d=await r.json();if(!active)return;setValid(r.ok&&d.valid===true);setEmail(typeof d.email==="string"?d.email:"");if(!r.ok)setError(d.error??"Convite inválido ou expirado.");}catch{if(active)setError("Não foi possível validar o convite.");}finally{if(active)setLoading(false);}}void check();return()=>{active=false};},[token]);
 async function submit(e:FormEvent<HTMLFormElement>){
  e.preventDefault(); setError("");
  if(password!==confirm){setError("As senhas não coincidem.");return;}
  setBusy(true);
  try {
   let signupSucceeded = false;
   try {
    const signup = await authClient.signUp.email({ email, password, name });
    signupSucceeded = !signup.error;
   } catch {
    signupSucceeded = false;
   }
   if (!signupSucceeded) {
    try {
     const signin = await authClient.signIn.email({ email, password });
     if (signin.error) throw new Error("sign-in failed");
    } catch {
     throw new Error("Não foi possível criar ou acessar a conta Neon Auth. Verifique os dados e tente novamente.");
    }
   }
   const r=await fetch("/api/admin/invitations/accept",{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({token,displayName:name})});
   const d=await r.json();
   if(!r.ok) throw new Error(d.error??"Não foi possível concluir o convite.");
   setDone(true);
  } catch(e) { setError(e instanceof Error?e.message:"Não foi possível criar a conta."); }
  finally { setBusy(false); }
 }
 return <main className={styles.page}><section className={styles.card}><Link href="/" className={styles.brand}><span>CNC</span> RORAIMA</Link><ShieldCheck size={34} className={styles.icon}/>{loading?<><h1>Validando convite</h1><p>Aguarde enquanto verificamos seu link.</p></>:done?<><h1>Conta criada</h1><p>Sua conta foi criada. O administrador precisa conceder as permissões antes que você possa usar as áreas do painel.</p><Link href="/admin" className={styles.button}>Ir para o painel</Link></>:!valid?<><h1>Convite indisponível</h1><p>{error||"Este convite expirou ou já foi utilizado."}</p><Link href="/admin" className={styles.button}>Voltar ao painel</Link></>:<><p className={styles.eyebrow}>CONVITE AO PAINEL</p><h1>Crie sua conta</h1><p>Convite para <strong>{email}</strong>. Crie sua identidade no Neon Auth com uma senha segura.</p><form onSubmit={submit} className={styles.form}><label>Nome completo<input required minLength={2} maxLength={100} autoComplete="name" value={name} onChange={e=>setName(e.target.value)} disabled={busy}/></label><label>Senha<input type="password" required minLength={12} maxLength={200} autoComplete="new-password" value={password} onChange={e=>setPassword(e.target.value)} disabled={busy}/><small>Use pelo menos 12 caracteres.</small></label><label>Confirmar senha<input type="password" required minLength={12} maxLength={200} autoComplete="new-password" value={confirm} onChange={e=>setConfirm(e.target.value)} disabled={busy}/></label>{error&&<p className={styles.error} role="alert">{error}</p>}<button className={styles.button} type="submit" disabled={busy}>{busy?"Criando conta…":"Criar conta"}</button></form></>}</section></main>;
}
