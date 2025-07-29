import React, { useState } from 'react';
import { Shield } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PrivacyPolicyDialogProps {
  className?: string;
}

export const PrivacyPolicyDialog: React.FC<PrivacyPolicyDialogProps> = ({
  className = ""
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <Button
        variant="soft"
        className={`w-full justify-start ${className}`}
        onClick={() => setIsOpen(true)}
      >
        <Shield className="w-4 h-4 mr-2" />
        Privacy Policy
      </Button>

      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle className="text-primary flex items-center space-x-2">
              <Shield className="w-5 h-5" />
              <span>Purposely App Privacy Policy</span>
            </DialogTitle>
          </DialogHeader>
          
          <ScrollArea className="h-[70vh] pr-4">
            <div className="space-y-6 text-sm text-foreground leading-relaxed">
              <div>
                <p className="font-medium text-primary mb-2">Effective date: July 25, 2025</p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">Privacy Policy ("Agreement")</h3>
                <p className="text-muted-foreground mb-2">Last Updated: December 17, 2024</p>
                <p>
                  Thank you for choosing to be part of our community at Better Convos LLC ("Company", "we", "us", "our"). We are committed to protecting your personal information and your right to privacy. If you have any questions or concerns about this privacy notice, or our practices with regards to your personal information regarding the Purposely Application, please contact us at info@betterconvos.com.
                </p>
              </div>

              <div>
                <p>
                  When you use our mobile application, as the case may be (the "App") and more generally, use any of our services (the "Services", which include the App), we appreciate that you are trusting us with your personal information. We take your privacy very seriously. In this privacy notice, we seek to explain to you in the clearest way possible what information we collect, how we use it and what rights you have in relation to it. We hope you take some time to read through it carefully, as it is important. If there are any terms in this privacy notice that you do not agree with, please discontinue use of our Services immediately.
                </p>
              </div>

              <div>
                <p>
                  This privacy notice applies to all information collected through our Services (which, as described above, includes our App), as well as any related services, sales, marketing or events. Please read this privacy notice carefully, as it will help you understand what we do with the information that we collect.
                </p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">1. WHAT INFORMATION DO WE COLLECT?</h3>
                <h4 className="font-medium mb-2">Information collected through our App</h4>
                <p className="mb-2"><strong>In Short:</strong> We collect information regarding your mobile device, push notifications, when you use our App.</p>
                <p className="mb-2">If you use our App, we may collect the following information:</p>
                
                <div className="ml-4 space-y-2">
                  <p><strong>Mobile Device Data.</strong> This includes your device ID, model, manufacturer, operating system, version, system configuration, IP address, mobile carrier, browser type and version, and information on how you use the App.</p>
                  <p><strong>Push Notifications.</strong> We may ask to send you push notifications related to your account or App functionality. You can opt out anytime in your device's settings.</p>
                </div>
                
                <p>This data helps us secure, operate, and analyze the App effectively.</p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">2. WILL YOUR INFORMATION BE SHARED WITH ANYONE?</h3>
                <p className="mb-2"><strong>In Short:</strong> Only under specific legal bases:</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>Consent</li>
                  <li>Legitimate Interests</li>
                  <li>Performance of a Contract</li>
                  <li>Legal Obligations</li>
                  <li>Vital Interests</li>
                  <li>Business Transfers</li>
                </ul>
                <p>We only share data when it is required to deliver our Services, fulfill legal responsibilities, or protect rights and safety.</p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">3. IS YOUR INFORMATION TRANSFERRED INTERNATIONALLY?</h3>
                <p><strong>In Short:</strong> Yes. Your information may be stored and processed outside your country. We take all necessary measures to protect your data in accordance with this policy and applicable laws.</p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">4. HOW LONG DO WE KEEP YOUR INFORMATION?</h3>
                <p><strong>In Short:</strong> We keep your data only as long as necessary for the purposes outlined here, unless required by law. When no longer needed, your data is deleted or anonymized.</p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">5. HOW DO WE KEEP YOUR INFORMATION SAFE?</h3>
                <p><strong>In Short:</strong> We implement security measures to protect your information, but no system is 100% secure. Use the App in secure environments and know that while we work hard to safeguard your data, we cannot guarantee absolute security.</p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">6. DO WE COLLECT INFORMATION FROM MINORS?</h3>
                <p><strong>In Short:</strong> No. The App is not intended for children under 18. If we become aware of such data, we will delete it promptly. If you know a minor has provided us personal data, contact info@betterconvos.com.</p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">7. WHAT ARE YOUR PRIVACY RIGHTS?</h3>
                <p className="mb-2"><strong>In Short:</strong> You may review, change, or delete your account and personal information at any time.</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>If you're in the EEA, you can contact your local data protection authority here.</li>
                  <li>If you're in Switzerland, visit this link.</li>
                </ul>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">8. CONTROLS FOR DO-NOT-TRACK FEATURES</h3>
                <p>We currently do not respond to DNT signals, as a uniform standard hasn't been adopted. We'll update our practices if that changes.</p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">9. DO CALIFORNIA RESIDENTS HAVE SPECIFIC PRIVACY RIGHTS?</h3>
                <p><strong>In Short:</strong> Yes. You may request information regarding our disclosure of your personal data and request deletion of publicly posted data. Submit requests to info@betterconvos.com with proof of residency and your associated account email.</p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">10. DO WE MAKE UPDATES TO THIS NOTICE?</h3>
                <p><strong>In Short:</strong> Yes. We'll update this policy as needed. Revisions will be marked by a "Last Updated" date and, if material, may be communicated directly or within the App.</p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">11. HOW CAN YOU CONTACT US ABOUT THIS NOTICE?</h3>
                <p>Please email us at info@betterconvos.com with any questions or comments.</p>
              </div>

              <div>
                <h3 className="font-semibold text-primary mb-2">12. HOW CAN YOU REVIEW, UPDATE, OR DELETE THE DATA WE COLLECT FROM YOU?</h3>
                <p className="mb-2">To access, correct, or delete your personal information, submit a request to info@betterconvos.com. We aim to respond within 30 days.</p>
                <ul className="ml-4 list-disc space-y-1">
                  <li>By email: info@betterconvos.com</li>
                  <li>By visiting this page on our website: thepurposelyapp.com</li>
                </ul>
              </div>
            </div>
          </ScrollArea>
        </DialogContent>
      </Dialog>
    </>
  );
};