'use client';

import { useState, useEffect } from 'react';
import Navigation from '@/components/Navigation';
import { store } from '@/lib/store';
import { AgencyProfile } from '@/lib/types';
import {
  Upload,
  Trash2,
  CheckCircle2,
  Calendar,
  Building,
  Info,
  Pencil,
  Milk,
} from 'lucide-react';

export default function AgencyProfilePage() {
  const [profile, setProfile] = useState<AgencyProfile>({
    business_name: 'Nandini Milk Parlour',
    phone: '7022754524',
    gstin: '',
    email: 'maheshgultedar545@gmail.com',
    account_beginning_date: '2026-07-27',
    business_type: 'Distributor',
    business_category: 'Dairy Farm Products/ Poultry',
    state: 'Karnataka',
    pincode: '560067',
    address: 'Nandini Milk Parlour, Opp. Nitesh Flushing Meadows, Towards Panchayat Road, Seegehalli, Bangalore',
    logo_url: '',
    signature_url: '',
  });

  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    setProfile(store.getAgencyProfile());
  }, []);

  const handleSave = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    store.saveAgencyProfile(profile);
    setSavedSuccess(true);
    setTimeout(() => setSavedSuccess(false), 3000);
  };

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfile((prev) => ({ ...prev, logo_url: base64 }));
        store.saveAgencyProfile({ logo_url: base64 });
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        setProfile((prev) => ({ ...prev, signature_url: base64 }));
        store.setSignatureImage(base64);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleRemoveSignature = () => {
    setProfile((prev) => ({ ...prev, signature_url: '' }));
    store.setSignatureImage(null);
  };

  return (
    <Navigation>
      <main className="max-w-7xl w-full mx-auto p-4 md:p-6 space-y-6">

        {/* Page Header */}
        <div className="flex items-center justify-between border-b border-slate-200 pb-4">
          <div>
            <h1 className="text-xl md:text-2xl font-black text-slate-800 tracking-tight">Edit Profile</h1>
            <p className="text-xs text-slate-500">
              Configure agency business details, contact information, address, and authorized signature for invoices
            </p>
          </div>

          {savedSuccess && (
            <div className="flex items-center space-x-1.5 bg-emerald-100 text-emerald-800 px-3 py-1.5 rounded-lg text-xs font-bold animate-pulse">
              <CheckCircle2 className="w-4 h-4" />
              <span>Profile Saved Successfully!</span>
            </div>
          )}
        </div>

        {/* Edit Profile Form Container matching User's UI Design */}
        <form onSubmit={handleSave} className="bg-white rounded-2xl border border-slate-200 shadow-xs p-6 space-y-8">

          {/* Top Logo Upload Badge */}
          <div className="flex items-center space-x-4">
            <div className="relative group">
              <div className="w-24 h-24 rounded-full border-2 border-nandini-blue flex items-center justify-center bg-blue-50 overflow-hidden shadow-xs">
                {profile.logo_url ? (
                  <img src={profile.logo_url} alt="Agency Logo" className="w-full h-full object-cover" />
                ) : (
                  <div className="text-center p-2">
                    <Milk className="w-10 h-10 text-nandini-blue mx-auto" />
                    <span className="text-[10px] font-black text-nandini-blue block uppercase mt-0.5">Nandini</span>
                  </div>
                )}
              </div>
              <label className="absolute bottom-0 right-0 bg-white border border-slate-300 p-1.5 rounded-full text-slate-600 shadow-md cursor-pointer hover:bg-slate-50 transition">
                <Pencil className="w-3.5 h-3.5" />
                <input type="file" accept="image/*" onChange={handleLogoUpload} className="hidden" />
              </label>
            </div>

            <div>
              <h2 className="text-base font-bold text-slate-900">{profile.business_name || 'Nandini Milk Parlour'}</h2>
              <p className="text-xs text-slate-500">Agency Business Profile & Invoice Details</p>
            </div>
          </div>

          {/* 3 Column Form Layout */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">

            {/* Column 1: Business Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">Business Details</h3>

              <div>
                <label className="block font-medium text-slate-700 text-xs mb-1">
                  Business Name<span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={profile.business_name}
                  onChange={(e) => setProfile({ ...profile, business_name: e.target.value })}
                  className="w-full px-3 py-2 border border-blue-400 focus:border-blue-600 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 text-xs mb-1">Phone Number</label>
                <input
                  type="tel"
                  value={profile.phone}
                  onChange={(e) => setProfile({ ...profile, phone: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center space-x-1 mb-1">
                  <label className="block font-medium text-slate-600 text-xs">GSTIN</label>
                  <Info className="w-3 h-3 text-slate-400" />
                </div>
                <input
                  type="text"
                  value={profile.gstin || ''}
                  onChange={(e) => setProfile({ ...profile, gstin: e.target.value })}
                  placeholder="Enter GSTIN"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 text-xs mb-1">Email ID</label>
                <input
                  type="email"
                  value={profile.email}
                  onChange={(e) => setProfile({ ...profile, email: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>

              <div>
                <label className="block font-medium text-slate-600 text-xs mb-1">Account Books Beginning Date</label>
                <div className="relative">
                  <input
                    type="date"
                    value={profile.account_beginning_date}
                    onChange={(e) => setProfile({ ...profile, account_beginning_date: e.target.value })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-100 focus:outline-none pr-8"
                  />
                  <Calendar className="w-4 h-4 text-blue-500 absolute right-2.5 top-2.5 pointer-events-none" />
                </div>
              </div>
            </div>

            {/* Column 2: More Details */}
            <div className="space-y-4">
              <h3 className="font-bold text-slate-900 text-sm border-b border-slate-100 pb-2">More Details</h3>

              <div>
                <label className="block font-medium text-slate-600 text-xs mb-1">Business Type</label>
                <select
                  value={profile.business_type}
                  onChange={(e) => setProfile({ ...profile, business_type: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
                >
                  <option value="Distributor">Distributor</option>
                  <option value="Agency">Agency / Franchise</option>
                  <option value="Retailer">Retailer</option>
                  <option value="Wholesaler">Wholesaler</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 text-xs mb-1">Business Category</label>
                <select
                  value={profile.business_category}
                  onChange={(e) => setProfile({ ...profile, business_category: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
                >
                  <option value="Dairy Farm Products/ Poultry">Dairy Farm Products/ Poultry</option>
                  <option value="FMCG Products">FMCG Products</option>
                  <option value="Food & Beverages">Food & Beverages</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 text-xs mb-1">State</label>
                <select
                  value={profile.state}
                  onChange={(e) => setProfile({ ...profile, state: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium bg-white focus:ring-2 focus:ring-blue-100 focus:outline-none"
                >
                  <option value="Karnataka">Karnataka</option>
                  <option value="Tamil Nadu">Tamil Nadu</option>
                  <option value="Andhra Pradesh">Andhra Pradesh</option>
                  <option value="Kerala">Kerala</option>
                  <option value="Maharashtra">Maharashtra</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-slate-600 text-xs mb-1">Pincode</label>
                <input
                  type="text"
                  value={profile.pincode}
                  onChange={(e) => setProfile({ ...profile, pincode: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-100 focus:outline-none"
                />
              </div>
            </div>

            {/* Column 3: Address & Add Signature Box */}
            <div className="space-y-4">
              <div>
                <label className="block font-medium text-slate-600 text-xs mb-1">Business Address</label>
                <textarea
                  rows={4}
                  value={profile.address}
                  onChange={(e) => setProfile({ ...profile, address: e.target.value })}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg text-slate-900 font-medium focus:ring-2 focus:ring-blue-100 focus:outline-none text-xs leading-relaxed"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block font-medium text-slate-600 text-xs">Add Signature</label>
                  {profile.signature_url && (
                    <button
                      type="button"
                      onClick={handleRemoveSignature}
                      className="text-rose-600 hover:text-rose-700 font-semibold text-[11px] flex items-center space-x-1"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>Remove Signature</span>
                    </button>
                  )}
                </div>

                <div className="border-2 border-dashed border-slate-300 rounded-xl p-4 text-center hover:border-slate-400 transition bg-slate-50/50">
                  {profile.signature_url ? (
                    <div className="space-y-2">
                      <img src={profile.signature_url} alt="Signature Preview" className="h-16 w-auto max-w-[200px] mx-auto object-contain" />
                      <div className="text-[10px] text-emerald-700 font-bold flex items-center justify-center space-x-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Signature Active on Invoices</span>
                      </div>
                    </div>
                  ) : (
                    <label className="cursor-pointer block py-4 space-y-2">
                      <Upload className="w-7 h-7 text-slate-400 mx-auto" />
                      <span className="text-xs font-semibold text-slate-600 block">Upload Signature</span>
                      <span className="text-[10px] text-slate-400 block">Supports JPG, PNG image files</span>
                      <input type="file" accept="image/*" onChange={handleSignatureUpload} className="hidden" />
                    </label>
                  )}
                </div>
              </div>
            </div>

          </div>

          {/* Action Buttons at bottom right */}
          <div className="flex items-center justify-end space-x-3 pt-6 border-t border-slate-100">
            <button
              type="button"
              onClick={() => setProfile(store.getAgencyProfile())}
              className="px-5 py-2.5 border border-slate-300 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-50 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-6 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-md transition active:scale-95"
            >
              Save Changes
            </button>
          </div>

        </form>

      </main>
    </Navigation>
  );
}
