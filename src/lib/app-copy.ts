import type { Locale } from "./types";

const copy = {
  en: {
    app:"Workspace", dashboard:"Dashboard", projects:"Projects", discover:"Discover", interests:"Interests", chat:"Messages", notifications:"Notifications", settings:"Settings", admin:"Administration", signIn:"Sign in", signOut:"Sign out",
    loginTitle:"Build trusted introductions.", loginBody:"Sign in with Google or a secure email link. Thalir never exposes a founder’s deeper idea without their approval.", email:"Email address", emailAction:"Email me a sign-in link", google:"Continue with Google", unavailable:"The secure workspace is not connected in this environment yet.",
    onboarding:"Set up your account", rolePrompt:"Choose one primary role. This cannot be changed without an administrator.", founder:"Startup founder", investor:"Investor", continue:"Continue", pending:"Plan approval pending", createProject:"Create a project", projectIntro:"Share the problem and context—not your proprietary solution.", save:"Save", noProjects:"No projects yet.", noResults:"Nothing to show yet.", planned:"Planned", privateNote:"Only approved project members and chat participants can see private information.",
  },
  ml: {
    app:"വർക്ക്‌സ്‌പേസ്", dashboard:"ഡാഷ്‌ബോർഡ്", projects:"പ്രോജക്റ്റുകൾ", discover:"കണ്ടെത്തുക", interests:"താൽപര്യങ്ങൾ", chat:"സന്ദേശങ്ങൾ", notifications:"അറിയിപ്പുകൾ", settings:"ക്രമീകരണങ്ങൾ", admin:"അഡ്മിനിസ്ട്രേഷൻ", signIn:"സൈൻ ഇൻ", signOut:"സൈൻ ഔട്ട്",
    loginTitle:"വിശ്വാസമുള്ള പരിചയങ്ങൾ സൃഷ്ടിക്കൂ.", loginBody:"Google അല്ലെങ്കിൽ സുരക്ഷിത ഇമെയിൽ ലിങ്ക് ഉപയോഗിച്ച് സൈൻ ഇൻ ചെയ്യുക. സ്ഥാപകന്റെ അനുമതിയില്ലാതെ ആഴത്തിലുള്ള ആശയവിവരങ്ങൾ തളിർ പുറത്തുവിടില്ല.", email:"ഇമെയിൽ വിലാസം", emailAction:"സൈൻ ഇൻ ലിങ്ക് അയയ്ക്കുക", google:"Google ഉപയോഗിച്ച് തുടരുക", unavailable:"ഈ പരിതസ്ഥിതിയിൽ സുരക്ഷിത വർക്ക്‌സ്‌പേസ് ഇതുവരെ ബന്ധിപ്പിച്ചിട്ടില്ല.",
    onboarding:"അക്കൗണ്ട് സജ്ജമാക്കുക", rolePrompt:"ഒരു പ്രധാന റോൾ തിരഞ്ഞെടുക്കുക. അഡ്മിൻ സഹായമില്ലാതെ ഇത് മാറ്റാനാവില്ല.", founder:"സ്റ്റാർട്ടപ്പ് സ്ഥാപകൻ", investor:"നിക്ഷേപകൻ", continue:"തുടരുക", pending:"പ്ലാൻ അംഗീകാരം കാത്തിരിക്കുന്നു", createProject:"പ്രോജക്റ്റ് സൃഷ്ടിക്കുക", projectIntro:"പ്രശ്നവും പശ്ചാത്തലവും പങ്കിടുക—സ്വകാര്യ പരിഹാരം അല്ല.", save:"സംരക്ഷിക്കുക", noProjects:"പ്രോജക്റ്റുകളൊന്നുമില്ല.", noResults:"ഇപ്പോൾ കാണിക്കാൻ ഒന്നുമില്ല.", planned:"പദ്ധതിയിലുള്ളത്", privateNote:"അംഗീകൃത അംഗങ്ങൾക്കും ചാറ്റ് പങ്കാളികൾക്കും മാത്രമേ സ്വകാര്യ വിവരങ്ങൾ കാണാനാകൂ.",
  },
} satisfies Record<Locale,Record<string,string>>;
export const getAppCopy = (locale:Locale) => copy[locale];
