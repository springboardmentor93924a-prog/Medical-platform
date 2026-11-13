import { useState } from "react";
import { Eye, EyeOff, Lock } from "lucide-react";
import Field, { inputCls } from "./Field.jsx";

// Password input with a show/hide button that is always visible
export default function PasswordField({ id, label, name, value, onChange, placeholder, autoComplete, error, hint }) {
  const [show, setShow] = useState(false);
  return (
    <Field
      id={id} label={label} icon={Lock} error={error} hint={hint}
      right={
        <button
          type="button" onClick={() => setShow(!show)}
          aria-label={show ? "Hide password" : "Show password"}
          className="absolute right-2 top-1/2 grid size-9 -translate-y-1/2 place-items-center rounded-lg text-slate-500 hover:bg-teal-50 hover:text-teal-700 focus-visible:outline-2 focus-visible:outline-teal-600"
        >
          {show ? <EyeOff className="size-5" /> : <Eye className="size-5" />}
        </button>
      }
    >
      <input
        id={id} name={name} type={show ? "text" : "password"} required
        autoComplete={autoComplete} value={value} onChange={onChange}
        placeholder={placeholder} className={`${inputCls} pr-12`}
      />
    </Field>
  );
}