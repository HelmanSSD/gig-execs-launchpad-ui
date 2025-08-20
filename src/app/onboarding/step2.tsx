import { useState, useRef, useEffect } from 'react';
import { ArrowLeft, Upload, User } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { getCurrentUser } from '@/lib/getCurrentUser';

export default function OnboardingStep2() {
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    headline: '',
    bio: '',
    city: '',
    country: ''
  });
  const [profilePicture, setProfilePicture] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const navigate = useNavigate();

  // Countries list (static - unlikely to change)
  const countries = [
    'Afghanistan', 'Albania', 'Algeria', 'Andorra', 'Angola', 'Antigua and Barbuda', 'Argentina', 'Armenia', 'Australia', 'Austria',
    'Azerbaijan', 'Bahamas', 'Bahrain', 'Bangladesh', 'Barbados', 'Belarus', 'Belgium', 'Belize', 'Benin', 'Bhutan',
    'Bolivia', 'Bosnia and Herzegovina', 'Botswana', 'Brazil', 'Brunei', 'Bulgaria', 'Burkina Faso', 'Burundi', 'Cabo Verde', 'Cambodia',
    'Cameroon', 'Canada', 'Central African Republic', 'Chad', 'Chile', 'China', 'Colombia', 'Comoros', 'Congo', 'Costa Rica',
    'Croatia', 'Cuba', 'Cyprus', 'Czech Republic', 'Democratic Republic of the Congo', 'Denmark', 'Djibouti', 'Dominica', 'Dominican Republic', 'Ecuador',
    'Egypt', 'El Salvador', 'Equatorial Guinea', 'Eritrea', 'Estonia', 'Eswatini', 'Ethiopia', 'Fiji', 'Finland', 'France',
    'Gabon', 'Gambia', 'Georgia', 'Germany', 'Ghana', 'Greece', 'Grenada', 'Guatemala', 'Guinea', 'Guinea-Bissau',
    'Guyana', 'Haiti', 'Honduras', 'Hungary', 'Iceland', 'India', 'Indonesia', 'Iran', 'Iraq', 'Ireland',
    'Israel', 'Italy', 'Ivory Coast', 'Jamaica', 'Japan', 'Jordan', 'Kazakhstan', 'Kenya', 'Kiribati', 'Kuwait',
    'Kyrgyzstan', 'Laos', 'Latvia', 'Lebanon', 'Lesotho', 'Liberia', 'Libya', 'Liechtenstein', 'Lithuania', 'Luxembourg',
    'Madagascar', 'Malawi', 'Malaysia', 'Maldives', 'Mali', 'Malta', 'Marshall Islands', 'Mauritania', 'Mauritius', 'Mexico',
    'Micronesia', 'Moldova', 'Monaco', 'Mongolia', 'Montenegro', 'Morocco', 'Mozambique', 'Myanmar', 'Namibia', 'Nauru',
    'Nepal', 'Netherlands', 'New Zealand', 'Nicaragua', 'Niger', 'Nigeria', 'North Korea', 'North Macedonia', 'Norway', 'Oman',
    'Pakistan', 'Palau', 'Palestine', 'Panama', 'Papua New Guinea', 'Paraguay', 'Peru', 'Philippines', 'Poland', 'Portugal',
    'Qatar', 'Romania', 'Russia', 'Rwanda', 'Saint Kitts and Nevis', 'Saint Lucia', 'Saint Vincent and the Grenadines', 'Samoa', 'San Marino', 'Sao Tome and Principe',
    'Saudi Arabia', 'Senegal', 'Serbia', 'Seychelles', 'Sierra Leone', 'Singapore', 'Slovakia', 'Slovenia', 'Solomon Islands', 'Somalia',
    'South Africa', 'South Korea', 'South Sudan', 'Spain', 'Sri Lanka', 'Sudan', 'Suriname', 'Sweden', 'Switzerland', 'Syria',
    'Taiwan', 'Tajikistan', 'Tanzania', 'Thailand', 'Timor-Leste', 'Togo', 'Tonga', 'Trinidad and Tobago', 'Tunisia', 'Turkey',
    'Turkmenistan', 'Tuvalu', 'Uganda', 'Ukraine', 'United Arab Emirates', 'United Kingdom', 'United States', 'Uruguay', 'Uzbekistan', 'Vanuatu',
    'Vatican City', 'Venezuela', 'Vietnam', 'Yemen', 'Zambia', 'Zimbabwe'
  ];

  // Check if all required fields are filled
  const isFormValid = formData.firstName.trim() && 
                     formData.lastName.trim() && 
                     formData.headline.trim() &&
                     formData.city.trim() &&
                     formData.country.trim();

  // Load user data from Supabase on component mount
  useEffect(() => {
    const loadUserData = async () => {
      try {
        const user = await getCurrentUser();
        if (user) {
          // Load basic user data
          setFormData(prev => ({
            ...prev,
            firstName: user.firstName || '',
            lastName: user.lastName || ''
          }));

          // Load existing profile data from consultant_profiles table
          const { data: profileData } = await supabase
            .from('consultant_profiles')
            .select('job_title, bio, address1, country')
            .eq('user_id', user.id)
            .single();

          console.log('Step 2: Loaded profile data:', profileData);

          if (profileData) {
            setFormData(prev => ({
              ...prev,
              headline: profileData.job_title || '',
              bio: profileData.bio || '',
              city: profileData.address1 || '',
              country: profileData.country || ''
            }));
            console.log('Step 2: Updated form data with profile data');
          } else {
            console.log('Step 2: No existing profile data found');
          }

          // Load existing profile picture URL from users table
          if (user.profilePhotoUrl) {
            setProfilePicture(user.profilePhotoUrl);
            console.log('Step 2: Loaded existing profile picture:', user.profilePhotoUrl);
          }
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleProfilePictureUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setProfilePicture(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const saveToSupabase = async () => {
    try {
      const user = await getCurrentUser();
      if (!user) {
        console.error('No user found');
        return;
      }

      // Update users table with basic profile data
      const { error: userError } = await supabase
        .from('users')
        .update({
          first_name: formData.firstName,
          last_name: formData.lastName,
          profile_photo_url: profilePicture,
          updated_at: new Date().toISOString()
        })
        .eq('id', user.id);

      if (userError) {
        console.error('Error updating user:', userError);
        console.log('User update error details:', {
          message: userError.message,
          code: userError.code,
          details: userError.details,
          hint: userError.hint
        });
        return;
      }

      // Update consultant_profiles table with detailed profile data
      const { error: profileError } = await supabase
        .from('consultant_profiles')
        .update({
          job_title: formData.headline,
          bio: formData.bio || null,
          address1: formData.city,
          country: formData.country,
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);

      if (profileError) {
        console.error('Error updating consultant profile:', profileError);
        console.log('Profile update error details:', {
          message: profileError.message,
          code: profileError.code,
          details: profileError.details,
          hint: profileError.hint
        });
        return;
      }

      console.log('Profile data saved successfully');
    } catch (error) {
      console.error('Error saving profile data:', error);
    }
  };

  const handleContinue = async () => {
    if (!isFormValid) return;
    
    await saveToSupabase();
    navigate('/onboarding/step3');
  };

  const handleBack = () => {
    navigate('/onboarding/step1');
  };

  const handleSkip = async () => {
    await saveToSupabase();
    navigate('/onboarding/step3');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 flex items-center justify-center">
        <div className="text-slate-600">Loading profile...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <div className="bg-white border-b border-slate-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center gap-3 sm:gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-600" />
            </button>
            <div className="text-2xl font-bold text-[#012E46]">GigExecs</div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Stepped Process Indicator */}
        <div className="mb-6 sm:mb-8">
          <div className="flex items-center justify-center space-x-1 sm:space-x-2 overflow-x-auto px-2 max-w-full">
            {[1, 2, 3, 4, 5, 6].map((step) => (
              <div key={step} className="flex items-center flex-shrink-0">
                <div className={`w-6 h-6 sm:w-8 sm:h-8 rounded-full flex items-center justify-center text-xs sm:text-sm font-semibold ${
                  step === 2 
                    ? 'bg-[#012E46] text-white' 
                    : step < 2
                    ? 'bg-green-500 text-white'
                    : 'bg-slate-200 text-slate-600'
                }`}>
                  {step}
                </div>
                {step < 6 && (
                  <div className={`w-6 sm:w-8 lg:w-12 h-1 mx-1 sm:mx-2 ${
                    step <= 2 ? 'bg-[#012E46]' : 'bg-slate-200'
                  }`}></div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Main Card */}
        <div className="w-full max-w-2xl mx-auto px-2 sm:px-0">
          <Card className="bg-white shadow-lg border-0">
            <CardContent className="p-4 sm:p-6 lg:p-8">
              {/* Title */}
              <h1 className="text-2xl sm:text-3xl font-bold text-[#012E46] mb-6 sm:mb-8 text-center">
                Your Profile
              </h1>

              {/* Profile Picture Section */}
              <div className="mb-6 sm:mb-8">
                <Label className="text-sm font-medium text-[#012E46] mb-3 block">
                  Add a profile picture*
                </Label>
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-200 flex items-center justify-center overflow-hidden">
                      {profilePicture ? (
                        <img 
                          src={profilePicture} 
                          alt="Profile" 
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <User className="w-12 h-12 sm:w-16 sm:h-16 text-slate-400" />
                      )}
                    </div>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="absolute -bottom-1 -right-1 w-8 h-8 sm:w-10 sm:h-10 bg-yellow-400 rounded-full flex items-center justify-center hover:bg-yellow-500 transition-colors"
                    >
                      <Upload className="w-4 h-4 sm:w-5 sm:h-5 text-slate-800" />
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleProfilePictureUpload}
                      className="hidden"
                    />
                  </div>
                </div>
              </div>

              {/* Form Fields */}
              <div className="space-y-4 sm:space-y-6 mb-6 sm:mb-8">
                {/* First Name */}
                <div>
                  <Label htmlFor="firstName" className="text-sm font-medium text-[#012E46]">
                    First name*
                  </Label>
                  <Input
                    id="firstName"
                    value={formData.firstName}
                    onChange={(e) => handleInputChange('firstName', e.target.value)}
                    className="mt-2"
                    placeholder="Enter your first name"
                  />
                </div>

                {/* Last Name */}
                <div>
                  <Label htmlFor="lastName" className="text-sm font-medium text-[#012E46]">
                    Last name*
                  </Label>
                  <Input
                    id="lastName"
                    value={formData.lastName}
                    onChange={(e) => handleInputChange('lastName', e.target.value)}
                    className="mt-2"
                    placeholder="Enter your last name"
                  />
                </div>

                {/* Headline */}
                <div>
                  <Label htmlFor="headline" className="text-sm font-medium text-[#012E46]">
                    Headline*
                  </Label>
                  <Input
                    id="headline"
                    value={formData.headline}
                    onChange={(e) => handleInputChange('headline', e.target.value)}
                    className="mt-2"
                    placeholder="How could you add value to potential clients?"
                  />
                </div>

                {/* Bio */}
                <div>
                  <Label htmlFor="bio" className="text-sm font-medium text-[#012E46]">
                    Bio (Optional)
                  </Label>
                  <Textarea
                    id="bio"
                    value={formData.bio}
                    onChange={(e) => handleInputChange('bio', e.target.value)}
                    className="mt-2 min-h-[100px] resize-none"
                    placeholder="Write a short bio about yourself here..."
                    maxLength={2000}
                  />
                  <div className="text-xs text-slate-500 mt-1 text-right">
                    {formData.bio.length}/2000 characters
                  </div>
                </div>

                {/* City */}
                <div>
                  <Label htmlFor="city" className="text-sm font-medium text-[#012E46]">
                    City*
                  </Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => handleInputChange('city', e.target.value)}
                    className="mt-2"
                    placeholder="Enter your city"
                  />
                </div>

                {/* Country */}
                <div>
                  <Label htmlFor="country" className="text-sm font-medium text-[#012E46]">
                    Country*
                  </Label>
                  <Select value={formData.country} onValueChange={(value) => handleInputChange('country', value)}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Select your country" />
                    </SelectTrigger>
                    <SelectContent>
                      {countries.map((country) => (
                        <SelectItem key={country} value={country}>
                          {country}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Required Fields Note */}
              <div className="text-sm text-red-600 mb-6 sm:mb-8 text-center">
                All fields marked with * are required before proceeding
              </div>

              {/* Navigation Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4">
                <Button
                  onClick={handleBack}
                  variant="outline"
                  className="flex-1 sm:flex-none px-8 py-3 text-lg border-[#012E46] text-[#012E46] hover:bg-[#012E46] hover:text-white"
                >
                  Back
                </Button>
                <Button
                  onClick={handleContinue}
                  disabled={!isFormValid}
                  className="flex-1 sm:flex-none px-8 py-3 text-lg bg-gradient-to-r from-[#012E46] to-[#4885AA] hover:from-[#011E36] hover:to-[#3A7A9A] text-white border-0 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Continue
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Skip Link */}
        <div className="text-center mt-6 sm:mt-8">
          <button
            onClick={handleSkip}
            className="text-[#012E46] hover:text-[#4885AA] underline text-sm"
          >
            I'll do this later
          </button>
        </div>
      </div>
    </div>
  );
}
