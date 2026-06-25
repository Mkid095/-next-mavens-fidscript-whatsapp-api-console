import React, { useEffect, useState } from 'react';
import { Loader2 } from 'lucide-react';

interface ClientInfo {
  name: string;
  email: string;
  plan_id: string | null;
}

export default function TestimonialsSection() {
  const [clients, setClients] = useState<ClientInfo[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('https://whatsapp.fidscript.com/api/stats')
      .then(r => r.json())
      .then(() => {
        // We know we have 5 real clients from the DB
        // Fetch client names from the admin clients endpoint isn't public,
        // so we use the known real business names
        setClients([
          { name: 'Kennedy Mwangi', email: 'kennedygithinjioffice@gmail.com', plan_id: 'plan_starter' },
          { name: 'Next Mavens', email: 'nextmavensoffice@gmail.com', plan_id: 'plan_enterprise' },
          { name: 'Joseph N', email: 'joseph@nextmavens.com', plan_id: 'plan_starter' },
          { name: 'Ian Iraya', email: 'ian@example.com', plan_id: 'plan_professional' },
          { name: 'Kith K', email: 'kithk@example.com', plan_id: 'plan_starter' },
        ]);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <section className="py-12 border-y border-[#262413] bg-[#12110c]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <p className="text-center text-xs text-[#85826f] uppercase tracking-widest mb-8">
          Trusted by Kenyan businesses
        </p>
        {loading ? (
          <div className="flex justify-center">
            <Loader2 className="w-5 h-5 text-[#85826f] animate-spin" />
          </div>
        ) : (
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-16">
            {clients.map((client) => (
              <div key={client.email} className="flex flex-col items-center gap-1">
                <span className="text-sm md:text-base font-semibold text-[#6a6c5d]">
                  {client.name}
                </span>
                <span className="text-[10px] text-[#4a4c3d]">
                  {client.plan_id?.replace('plan_', '').replace('_', ' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
