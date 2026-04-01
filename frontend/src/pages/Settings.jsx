import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'
import { Settings as SettingsIcon, Cpu, Mail, User, Save, CheckCircle, Loader2, Eye, EyeOff } from 'lucide-react'
import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import { getSettings, updateSettings } from '../services/api'
import PageTransition from '../components/ui/PageTransition'

function Section({ title, icon: Icon, children }) {
  return (
    <div className="glass-card p-6">
      <h3 className="font-semibold text-white flex items-center gap-2 mb-5">
        <Icon size={16} className="text-brand-400" /> {title}
      </h3>
      {children}
    </div>
  )
}

function Field({ label, hint, children }) {
  return (
    <div>
      <label className="block text-xs text-gray-400 mb-1.5">{label}</label>
      {children}
      {hint && <p className="text-xs text-gray-600 mt-1">{hint}</p>}
    </div>
  )
}

function MaskedInput({ name, placeholder, register, ...rest }) {
  const [show, setShow] = useState(false)
  return (
    <div className="relative">
      <input
        {...register(name)}
        type={show ? 'text' : 'password'}
        placeholder={placeholder}
        className="input-dark pr-10"
        {...rest}
      />
      <button
        type="button"
        onClick={() => setShow((s) => !s)}
        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300"
      >
        {show ? <EyeOff size={14} /> : <Eye size={14} />}
      </button>
    </div>
  )
}

export default function Settings() {
  const qc = useQueryClient()
  const [saved, setSaved] = useState(false)

  const { data, isLoading } = useQuery({
    queryKey: ['settings'],
    queryFn:  getSettings,
    select:   (d) => d?.settings ?? {},
  })

  const { register, handleSubmit, reset } = useForm()

  useEffect(() => {
    if (data) reset(data)
  }, [data, reset])

  const { mutate, isPending } = useMutation({
    mutationFn: updateSettings,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['settings'] })
      setSaved(true)
      toast.success('Settings saved')
      setTimeout(() => setSaved(false), 3000)
    },
    onError: (err) => toast.error(err.message),
  })

  const onSubmit = (values) => mutate(values)

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto px-6 py-10">
        <div className="mb-8">
          <h1 className="page-header flex items-center gap-2">
            <SettingsIcon size={24} /> Settings
          </h1>
          <p className="page-subtitle">Configure LLM provider, API keys, and notification preferences</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
          {/* LLM Provider */}
          <Section title="LLM Provider" icon={Cpu}>
            <div className="space-y-4">
              <Field label="Provider" hint="Mock mode requires no API key — use for demos.">
                <select {...register('llm_provider')} className="input-dark">
                  <option value="mock">Mock (Demo Mode)</option>
                  <option value="openai">OpenAI GPT-4o</option>
                  <option value="claude">Anthropic Claude</option>
                  <option value="ollama">Ollama (Local)</option>
                </select>
              </Field>

              <Field label="OpenAI API Key">
                <MaskedInput name="openai_api_key" placeholder="sk-…" register={register} />
              </Field>

              <Field label="Anthropic API Key">
                <MaskedInput name="anthropic_api_key" placeholder="sk-ant-…" register={register} />
              </Field>

              <Field label="Ollama Base URL" hint="Default: http://localhost:11434">
                <input {...register('ollama_base_url')} type="text" placeholder="http://localhost:11434" className="input-dark" />
              </Field>
            </div>
          </Section>

          {/* Email / SMTP */}
          <Section title="Email (Report Delivery)" icon={Mail}>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Field label="SMTP Host">
                  <input {...register('smtp_host')} type="text" placeholder="smtp.gmail.com" className="input-dark" />
                </Field>
                <Field label="SMTP Port">
                  <input {...register('smtp_port')} type="number" placeholder="587" className="input-dark" />
                </Field>
              </div>
              <Field label="SMTP Username">
                <input {...register('smtp_username')} type="email" placeholder="you@gmail.com" className="input-dark" />
              </Field>
              <Field label="SMTP Password">
                <MaskedInput name="smtp_password" placeholder="App password" register={register} />
              </Field>
              <Field label="From Name">
                <input {...register('smtp_from_name')} type="text" placeholder="SalesIQ Reports" className="input-dark" />
              </Field>
            </div>
          </Section>

          {/* Defaults */}
          <Section title="Defaults" icon={User}>
            <Field label="Default Rep Name" hint="Auto-filled in the upload form.">
              <input {...register('default_rep_name')} type="text" placeholder="Jane Smith" className="input-dark" />
            </Field>
          </Section>

          {/* Save */}
          <button
            type="submit"
            disabled={isPending || isLoading}
            className="btn-primary w-full py-3.5 justify-center text-sm disabled:opacity-50"
          >
            {isPending ? (
              <><Loader2 size={15} className="animate-spin" /> Saving…</>
            ) : saved ? (
              <><CheckCircle size={15} /> Saved!</>
            ) : (
              <><Save size={15} /> Save Settings</>
            )}
          </button>
        </form>
      </div>
    </PageTransition>
  )
}
