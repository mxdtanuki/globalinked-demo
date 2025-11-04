import React, { useState, useRef, useEffect } from "react";
import Modal from "react-modal";
import "./LegalModals.css";

const customStyles = {
  overlay: {
    backgroundColor: "rgba(0, 0, 0, 0.75)",
    zIndex: 1000,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "20px",
  },
  content: {
    position: "relative",
    inset: "auto",
    border: "none",
    background: "white",
    overflow: "visible",
    padding: "0",
    borderRadius: "12px",
    width: "100%",
    maxWidth: "700px",
    height: "80vh",
    maxHeight: "700px",
    display: "flex",
    flexDirection: "column",
    boxShadow: "0 4px 20px rgba(0, 0, 0, 0.15)",
  },
};

Modal.setAppElement("#root");

const LegalModals = ({ isOpen, onClose, type }) => {
  const [internalType, setInternalType] = useState(null);

  const effectiveType = internalType || type;

  const handleClose = () => {
    setInternalType(null);
    if (onClose) onClose();
  };

  const scrollRef = useRef(null);

  // When the effective modal type changes to 'privacy', ensure the
  // scrollable content is positioned at the top.
  useEffect(() => {
    if (effectiveType === "privacy" && scrollRef.current) {
      // run on next frame after render
      requestAnimationFrame(() => {
        try {
          scrollRef.current.scrollTop = 0;
        } catch (e) {
          /* ignore */
        }
      });
    }
  }, [effectiveType]);

  const getContent = () => {
    switch (effectiveType) {
      case "terms":
        return (
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Terms of Use</h2>
              <button
                onClick={handleClose}
                className="modal-close-button"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-scroll-content" ref={scrollRef}>
              <div className="legal-content">
                <p className="last-updated">Last updated: July 4, 2018</p>

                <p>
                  Thank you for using the Polytechnic University of the
                  Philippines (“PUP” or “University”) online services. This is
                  provided by the University with main operations located at
                  Anonas Street, Santa Mesa, Manila, Philippines 1016.
                </p>

                <p>
                  By using our online services, you are agreeing to these terms.
                  Please read carefully.
                </p>

                <h3>Acceptance of Terms</h3>
                <p>
                  The online services that PUP provides to you are subject to
                  the following Terms of Use ("Terms"). This is an agreement
                  between you (either an individual or a single entity) and the
                  University. By visiting, browsing and/or interacting with our
                  online services, you agree to be bound by this Terms.
                </p>
                <p>
                  PUP reserves the right to update the Terms at any time without
                  notice to you. The most current version of the Terms can be
                  viewed by clicking on the "Terms of Use" hypertext link
                  located at the bottom of our Web pages and online services.
                </p>
                <p>
                  The University offers various online services wherein
                  additional terms or requirements may apply. As such, these
                  terms will be available to relevant online services, and those
                  additional terms become part of your agreement with the
                  University if you use those online services.
                </p>

                <h3>Description of Services</h3>
                <p>
                  The University provides you access to its online services,
                  including its official Website (
                  <a
                    href="https://www.pup.edu.ph"
                    className="legal-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.pup.edu.ph
                  </a>
                  ), portals (intranet and learning), apps (Web, mobile and
                  desktop), social media channels, associated media, digital
                  materials, online/electronic documentation, and University
                  information (collectively referred to as "Services"). The
                  Services, its updates, enhancements, new features, and/or the
                  addition of any new online service are subject to this Terms.
                </p>

                <h3>Limitation of Use</h3>
                <p>
                  The Services are for your academic, non-profit and
                  non-commercial use. PUP grants you conditional access to
                  visit, browse, and interact with the Services as long as you
                  abide with this Terms on your computers running validly
                  licensed copies of software for which the Services were
                  designed.
                </p>

                <p>
                  The information including images and photos contained within
                  the Services (“Information”) are provided by PUP and may be
                  used for informational purposes only. You may not copy,
                  modify, distribute, transmit, display, reproduce, publish,
                  license, develop derivative/creative works from, transfer, or
                  sell any Information, forms or documentation obtained from the
                  Services.
                </p>

                <p>
                  PUP and its associated symbols, consisting the logo and the
                  typeface, should follow the standard. It must not be altered
                  in any way, such as in layout, shape, font, font style,
                  position or color. (
                  <a
                    href="https://drive.google.com/open?id=0B1BuDAuN0r8SeDZnZ1BiZkF0dUE"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="legal-link"
                  >
                    See PUP Logo Specification for more information
                  </a>
                  ).
                </p>

                <p>
                  When written permission to reproduce materials is granted, PUP
                  should be acknowledged as the source of the materials.
                </p>

                <p>
                  If any component of the Service or any of its components are
                  marked “Preview”, "Pre-released", "Beta", "Currently being
                  updated", "To be Updated" or "Under Construction", that
                  component constitutes pre-release Information and may be
                  changed substantially before its formal release. You have the
                  option not to use that Service in a live operating environment
                  where it may be relied upon to perform in the same manner as a
                  formally released component or with data that has not been
                  sufficiently backed up.
                </p>
                <h3>No Unlawful or Prohibited Use of the Services</h3>
                <p>
                  As a condition of your use of the Services, you will not use
                  the Services for any purpose that is unlawful or prohibited by
                  these Terms, conditions, and notices. You may not use the
                  Services in any manner that could damage, disable, overburden,
                  or impair any PUP server, or the network(s) connected to any
                  PUP server, or interfere with any other party's use and
                  enjoyment of any Services. You must not attempt to gain
                  unauthorized access to any Services, other accounts, computer
                  systems or networks connected to any PUP server or to any of
                  the Services, through hacking, password mining or any other
                  means. You may not obtain or attempt to obtain any materials
                  or information through any means not intentionally made
                  available through the Services.
                </p>

                <p>
                  You must not infiltrate, reverse engineer, decompile, or
                  disassemble the Services or any of its components. Also, you
                  must not use any special hardware or software to download all
                  the files from the Services (either with or without any
                  intention to vandalize, hack or destroy any/all Services).
                </p>

                <h3>Use of Services</h3>
                <p>
                  The Services may contain e-mail features, forum and bulletin
                  board, messaging, virtual communities, portals, calendars,
                  media galleries, social media channels, document and
                  communication management systems, and/or other message or
                  communication facilities designed to enable you to communicate
                  with others (each referred to as "Communication Service" and
                  collectively as "Communication Services"). You agree to use
                  the Communication Services only to post, send and receive
                  messages and material that are proper and, when applicable,
                  related to the particular Communication Service.
                </p>

                <p>
                  The University adheres to the basic principles of human
                  decency, respect and values. We have zero tolerance for
                  messages and comments that curse, trash, degrade, humiliate
                  and intimidate. Such behavior does little to inspire
                  intelligent and educated discussion. Freedom of speech does
                  not mean license to smear reputation and ruin credibility. Nor
                  does it mean the freedom to be irresponsible and to defame.
                  Freedom of speech, rather, is the recognition of the right of
                  anyone to speak his or her mind, and to express a contrary
                  view without being objectionable.
                </p>

                <p>
                  By way of example, and not limited to the following, you agree
                  that when you use the Communication Services, you will NOT:
                </p>
                <ul>
                  <li>
                    Use the Communication Services in connection with surveys,
                    contests, pyramid schemes, chain letters, junk email,
                    spamming or any duplicative or unsolicited messages
                    (commercial or otherwise);
                  </li>
                  <li>
                    Defame, abuse, harass, insult, curse, stalk, threaten or
                    otherwise violate the legal rights (such as rights of
                    privacy and publicity) of others;
                  </li>
                  <li>
                    Disrespect the views of others. Some topics that are posted
                    might be controversial or offensive to the sensibilities of
                    some. If you feel strongly against such topics, you can
                    practice courteous responses or report the concerned post to
                    the Service Administrator. We don't want any mudslinging and
                    flaming going on in the Services as it affects everyone;
                  </li>
                  <li>
                    Publish, post, disclose, upload, distribute or disseminate
                    any inappropriate, political, profane, defamatory, obscene,
                    vulgar, inaccurate, harassing, hateful, threatening,
                    indecent or unlawful topic, name, material or information;
                  </li>
                  <li>
                    Upload, or otherwise make available, files or documents that
                    contain images, photographs, software or other material
                    protected by intellectual property laws, including, by way
                    of example, and not limited to, copyright or trademark laws
                    (or by rights of privacy or publicity) unless you own or
                    control the rights thereto or have received all necessary
                    consent to do the same;
                  </li>
                  <li>
                    Use any material or information, including images or
                    photographs, which are made available through the Services
                    in any manner that infringes any copyright, trademark,
                    patent, trade secret, or other proprietary right of any
                    party;
                  </li>
                  <li>
                    Upload files that contain viruses, Trojan horses, worms,
                    time bombs, cancelbots, corrupted files, malware, ransomware
                    or any other similar software or programs that may damage
                    the operation of another's computer or property of another;
                  </li>
                  <li>
                    Advertise or offer to sell or buy any goods or services for
                    any business or commercial purpose;
                  </li>
                  <li>
                    Download any file posted by another user of a Communication
                    Service that you know, or reasonably should know, cannot be
                    legally reproduced, displayed, performed, and/or distributed
                    in such manner;
                  </li>
                  <li>
                    Falsify or delete any copyright management information, such
                    as author attributions, legal or other proper notices or
                    proprietary designations or labels of the origin or source
                    of software or other material contained in a file that is
                    uploaded;
                  </li>
                  <li>
                    Restrict or inhibit any other user from using and enjoying
                    the Communication Services;
                  </li>
                  <li>
                    Violate any code of conduct or other guidelines which may be
                    applicable for any particular Communication Service;
                  </li>
                  <li>
                    Harvest or otherwise collect information about others,
                    including e-mail addresses;
                  </li>
                  <li>Violate any applicable laws or regulations;</li>
                  <li>
                    Create a false identity for the purpose of misleading others
                    and the University;
                  </li>
                  <li>
                    Use, download or otherwise copy, or provide (whether or not
                    for a fee) to a person or entity any directory of users of
                    the Services or other user or usage information or any
                    portion thereof;
                  </li>
                  <li>
                    Type LYk DiS and refrain frm usng 2 mch encryptd txt
                    shrtcts. That way, everyone will have an easier time reading
                    the information;
                  </li>
                  <li>
                    Type in ALL CAPS or CAPITAL LETTERS throughout your content.
                    It gives others the wrong impression that you are shouting;
                  </li>
                  <li>
                    Flood posts as it will cause everyone to suffer in terms of
                    the site performance. Flooders who posts nonsense messages
                    could very well get their accounts banned. Also, avoid using
                    extensive uses of line spacing. We will consider this as
                    flooding;
                  </li>
                  <li>
                    Upload unnecessarily large images because it will ruin the
                    layout of the Service and slow down the loading of pages for
                    other users. Be considerate of other's bandwidth as most are
                    still using slow Internet connection;
                  </li>
                  <li>
                    Post personal information (personal email, mobile number,
                    landline number, etc.) of anyone. Doing so might leave the
                    victim open to harassment. Let us respect the privacy of
                    others; and
                  </li>
                  <li>
                    Use or register to the Services if you are below eighteen
                    (18) years of age without parental consent. Philippine laws
                    require minors to first obtain parental consent before
                    engaging with any transactions.
                  </li>
                </ul>

                <p>
                  PUP, its developers and third-party providers have no
                  obligation to monitor the Communication Services. However,
                  PUP, its developers and third-party providers reserve the
                  right to review materials posted to the Communication Services
                  and to remove any materials (including, by way of example, and
                  not limited to, posts and comments that violate standards of
                  civility) in its sole discretion, without notice, for any
                  reason whatsoever. PUP and third-party providers reserve the
                  right to terminate your access to any or all of the
                  Communication Services at any time, without notice, for any
                  reason whatsoever.
                </p>

                <p>
                  PUP reserves the right at all times to disclose any
                  information as PUP deems necessary to comply with any
                  applicable law, regulation, legal process or governmental
                  request, or to edit, refuse to post or to remove any
                  information or materials, in whole or in part, in PUP's sole
                  discretion, without notice, for any reason whatsoever.
                </p>

                <p>
                  Always use caution when giving out any personally identifiable
                  information about yourself, your family or your children in
                  any Communication Services. PUP, its developers and
                  third-party providers do not control or endorse the content,
                  messages or information found in any Communication Services
                  and, therefore, PUP, its developers and third-party providers
                  specifically disclaims any liability with regards to the
                  Communication Services and any actions resulting from your
                  participation in any Communication Services. Site managers and
                  hosts are not authorized PUP spokespersons, and their views do
                  not necessarily reflect those of PUP.
                </p>

                <p>
                  Materials uploaded to the Communication Services may be
                  subject to posted limitations on usage, reproduction and/or
                  dissemination; you are responsible for adhering to such
                  limitations if you download the materials.
                </p>

                <h3>Privacy Statement</h3>
                <p>
                  Read the Privacy Statement to learn how the University
                  collects and use your personal information.
                </p>
                <h3>Software Available via Services</h3>
                <p>
                  Any software that is made available to download from the
                  Services ("Software") is the copyrighted work of its
                  respective provider and/or its suppliers. Use of the Software
                  is governed by terms in its end user license agreement, if
                  any, which accompanies or is included with the Software
                  ("License Agreement"). End-users will be unable to install any
                  Software that has a License Agreement, unless they first agree
                  to the License Agreement terms. Third-party scripts or code,
                  linked to or referenced from the Services, are granted to you
                  by the respective companies that own such code, not by PUP.
                </p>

                <p>
                  The Software is made available for download solely for use by
                  end-users according to the License Agreement. Any reproduction
                  or redistribution of the Software not in accordance with the
                  License Agreement is expressly prohibited by law, and may
                  result in severe civil and criminal penalties. Violators will
                  be prosecuted to the maximum extent possible.
                </p>

                <p>
                  Without limiting the foregoing, copying or reproduction of the
                  Software to any other server or location for further
                  reproduction or redistribution is expressly prohibited, unless
                  such reproduction or redistribution is expressly permitted by
                  the License Agreement accompanying such Software.
                </p>

                <p>
                  The Software is warranted, if at all, only according to the
                  terms of the License Agreement. Except as warranted in the
                  License Agreement, PUP hereby disclaims all warranties and
                  conditions with regards to the Software, including all
                  warranties and conditions of merchantability, whether
                  expressed, implied or statutory, fitness for a particular
                  purpose, title and non-infringement. For your convenience, PUP
                  may make available a link to a particular Software as part of
                  the Services for use and/or download. PUP does not make any
                  assurances with regard to the accuracy of the results or
                  output that derives from such use of any such Software. Please
                  respect the intellectual property rights of others when using
                  the Software made available on the Services.
                </p>

                <p>
                  The Services and Software are provided with RESTRICTED RIGHTS.
                  Use, duplication, or disclosure by the Philippine Government
                  is subject to restrictions as set forth in its law and
                  constitution, as applicable.
                </p>

                <h3>Documents Available via Services</h3>
                <p>
                  The Information, articles (news, announcements, events,
                  notices, invitations), research papers, press releases,
                  statistical data, directory of offices and its officials,
                  reports, forms and FAQs (“Documents”) from the Services is
                  owned by PUP and is protected by intellectual property rights
                  and/or copyright, and may not be distributed, modified,
                  reproduced in whole or in part without prior written
                  permission from the Office of the University President.
                </p>

                <p>
                  When permission to use is granted, (1) PUP should be
                  acknowledged as the source of the materials and the copyright
                  notice must appear in all copies and that both the copyright
                  notice and this permission notice must also appear, (2) use of
                  such Documents from the Services is for informational,
                  non-profit and non-commercial or personal use only and will
                  not be copied or distributed on any network computer or
                  broadcast in any media, and (3) no modifications of any
                  Documents are made.
                </p>

                <p>
                  Educational institutions duly recognized and accredited by the
                  Government, such as K-12, universities, private/public
                  colleges and schools, may download and reproduce the Documents
                  for distribution in the classroom. Distribution outside the
                  classroom requires written permission. Use for any other
                  purpose is expressly prohibited by law, and may result in
                  severe civil and criminal penalties.
                </p>

                <p>
                  Documents specified in this Terms do not include the design or
                  layout of the Services. Elements of the Services are protected
                  by intellectual property, trade dress, trademark, unfair
                  competition, and other laws and may not be copied or imitated
                  in whole or in part. No logo, graphic, sound or image from any
                  Services may be copied or retransmitted unless expressly
                  permitted by the Office of the University President or the
                  third-party provider.
                </p>

                <p>
                  PUP and/or its respective partners make no representations
                  about the suitability of the Information contained in the
                  Documents and related graphics published as part of the
                  Services for any purpose. All such Documents and related
                  graphics are provided "AS IS" WITHOUT WARRANTY OF ANY KIND.
                  PUP and/or its respective partners hereby DISCLAIM ALL
                  WARRANTIES AND CONDITIONS WITH REGARD TO THIS INFORMATION,
                  including all warranties and conditions of merchantability,
                  whether express, implied or statutory, fitness for a
                  particular purpose, title and non-infringement. In no event
                  shall PUP, its employees, developers and/or its respective
                  partners be liable for any special, indirect or consequential
                  damages or any damages whatsoever resulting from loss of use,
                  data or profits, whether in an action of contract, negligence
                  or other tortious action, arising out of or in connection with
                  the use or performance of Information available from the
                  Services.
                </p>

                <p>
                  The Documents and related graphics published on the Services
                  could include technical inaccuracies or typographical errors.
                  Changes are periodically added to the Information herein. PUP,
                  its developers and/or its respective partners may make
                  improvements and/or changes in the Information and Services at
                  any time, even without notice to you.
                </p>

                <h3>User Account, Password and Security</h3>
                <p>
                  If any of the Services requires you to open an account, you
                  must complete the registration process by providing PUP with
                  current, complete and accurate information as prompted by the
                  applicable online registration form. Most Services may require
                  you a username and a password. Your username will uniquely
                  identify you from other users and is unchangeable throughout
                  your use of the Services. You are entirely responsible for
                  maintaining the confidentiality of your password and account.
                  Furthermore, you are entirely responsible for any and all
                  activities that occur within your account. You agree to notify
                  the PUP Information and Communications Technology Office
                  (“ICTO” or “ICT Office”) immediately of any unauthorized use
                  of your account or any other breach of security. PUP, ICTO,
                  its developers and third-party providers will not be liable
                  for any loss that you may incur as a result of someone else
                  using your password or account, either with or without your
                  knowledge. However, you could be held liable for losses
                  incurred by PUP or another party due to someone else using
                  your account or password. You may not use anyone else's
                  account at any time. Sharing of user account and password is
                  strictly prohibited.
                </p>

                <h3>Materials Provided to PUP or Posted at any Services</h3>
                <p>
                  PUP does not claim ownership of the materials you provide to
                  the University (including feedback and suggestions) or post,
                  upload, input or submit to any Services or its associated
                  services for review by the general public, or by the members
                  of any public or private community, (each a "Submission" and
                  collectively "Submissions"). However, by posting, uploading,
                  inputting, providing or submitting ("Posting") your Submission
                  you are granting PUP permission to use your Submission in
                  connection with the University's operation (including, without
                  limitation, all PUP Services), including, without limitation,
                  the license rights to: copy, distribute, transmit, publicly
                  display, publicly perform, reproduce, edit, translate and
                  reformat your Submission; to publish your name in connection
                  with your Submission; and the right to share such rights to
                  the University's colleges, offices, branches and campuses.
                </p>

                <p>
                  No compensation will be paid with respect to the use of your
                  Submission, as provided herein. PUP is under no obligation to
                  post or use any Submission you may provide and PUP may remove
                  any Submission at any time in its sole discretion, without
                  notice, for any reason whatsoever.
                </p>

                <p>
                  By Posting a Submission you warrant and represent that you own
                  or otherwise control all of the rights to your Submission as
                  described in these Terms of Use including, without limitation,
                  all the rights necessary for you to provide, post, upload,
                  input or submit the Submissions.
                </p>

                <p>
                  In addition to the warranty and representation set forth
                  above, by Posting a Submission that contain images,
                  photographs, pictures or that are otherwise graphical in whole
                  or in part ("Images"), you warrant and represent that (a) you
                  are the copyright owner of such Images, or that the copyright
                  owner of such Images has granted you permission to use such
                  Images or any content and/or images contained in such Images
                  consistent with the manner and purpose of your use and as
                  otherwise permitted by these Terms of Use and the Services,
                  (b) you have the rights necessary to grant the licenses and
                  sublicenses described in these Terms of Use, and (c) that each
                  person depicted in such Images, if any, has provided consent
                  to the use of the Images as set forth in these Terms of Use,
                  including, by way of example, and not as a limitation, the
                  distribution, public display and reproduction of such Images.
                  By Posting Images, you are granting (a) to all members of your
                  private community (for each such Images available to members
                  of such private community), and/or (b) to the general public
                  (for each such Images available anywhere on the Services,
                  other than a private community), permission to use your Images
                  in connection with the use, as permitted by these Terms of
                  Use, of any of the Services, (including, by way of example,
                  and not as a limitation, making prints and gift items which
                  include such Images), and including, without limitation, a
                  non-exclusive, world-wide, royalty-free license to: copy,
                  distribute, transmit, publicly display, publicly perform,
                  reproduce, edit, translate and reformat your Images without
                  having your name attached to such Images, and the right to
                  sublicense such rights to any supplier of the Services. The
                  licenses granted in the preceding sentences for the Images
                  will terminate at the time you completely remove such Images
                  from the Services, provided that, such termination shall not
                  affect any licenses granted in connection with such Images
                  prior to the time you completely remove such Images. No
                  compensation will be given with respect to the use of your
                  Images.
                </p>

                <h3>Copyright Infringement</h3>
                <p>
                  PUP respects the intellectual property rights of others. If
                  your copyright or trademark is being infringed, you may
                  contact the PUP Office of the Chief Legal Counsel
                  (legal@pup.edu.ph).
                </p>

                <h3>Links to Other Sites</h3>
                <p>
                  Links that are present in the Services will let you leave
                  PUP's site. The linked sites are not under the control of PUP
                  and the University is not responsible for the contents of any
                  linked site or any link contained in a linked site, or any
                  changes or updates to such sites. PUP is not responsible for
                  webcasting or any other form of transmission received from any
                  linked site. PUP is providing these links to you only as a
                  convenience, and the inclusion of any link does not imply
                  endorsement by the University of that site.
                </p>

                <h3>Submission of Unsolicited Idea</h3>
                <p>
                  PUP or any of its employees and developers or third-party
                  providers do not accept or consider unsolicited ideas,
                  including ideas for new campaigns, new promotions, new
                  products or technologies, processes, materials, marketing
                  plans or new product names. Please do not send any original
                  creative artwork, samples, demos, or other works. The sole
                  purpose of this policy is to avoid potential misunderstandings
                  or disputes when PUP's services or strategies might seem
                  similar to ideas submitted to PUP. So, please do not send your
                  unsolicited ideas to PUP or anyone at PUP if, despite our
                  request that you not send us your ideas and materials, you
                  still send them, please understand that PUP makes no
                  assurances that your ideas and materials will be treated as
                  confidential or proprietary.
                </p>
              </div>
            </div>
          </div>
        );

      case "privacy":
        return (
          <div className="modal-container">
            <div className="modal-header">
              <h2 className="modal-title">Privacy Statement</h2>
              <button
                onClick={handleClose}
                className="modal-close-button"
                aria-label="Close"
              >
                ×
              </button>
            </div>
            <div className="modal-scroll-content" ref={scrollRef}>
              <div className="legal-content">
                <p className="last-updated">Last updated: June 11, 2018</p>
                <p>
                  The Polytechnic University of the Philippines (“PUP” or
                  “University”) provides you access to its online services,
                  including its official Website (
                  <a
                    href="https://www.pup.edu.ph"
                    className="legal-link"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    www.pup.edu.ph
                  </a>
                  ), apps (Web, mobile and desktop), social media channels,
                  associated media, digital materials, online/electronic
                  documentation, and University information (collectively
                  referred to as "Services"). The Services, its updates,
                  enhancements, new features, and/or the addition of any new
                  online service are subject to this privacy statement.
                </p>
                <p>
                  PUP is very much aware in protecting your privacy and personal
                  information. This privacy statement discloses the data we
                  collect from you and how we use it.
                </p>
                <p>
                  This privacy statement only applies to the Services. Other
                  sites or apps that has a link from the Services may have a
                  separate privacy statement.
                </p>
                <h3>Collection of Personal Data</h3>
                <p>
                  PUP collects data to operate effectively and provide you the
                  best experiences with our Services. You provide some of this
                  data directly, such as when you register for an entrance
                  test/exam online, submit a search query to the PUPWebSite,
                  send us feedback online, upload media to the PUP Media
                  Gallery, participate in the PUP Online Survey, purchase a book
                  from the PUP Bookstore, sign up for PUP WebMail or Office 365,
                  or contact us for inquiries and technical support. We get some
                  of it by recording how you interact with our Services by, for
                  example, using technologies like cookies, and receiving error
                  reports or usage data from Services running on your device.
                </p>
                <p>
                  We also obtain data from third parties. We protect data
                  obtained from third parties according to the practices
                  described in this statement and any additional restrictions
                  imposed by the source of the data. These third-party sources
                  vary over time, but have included:
                </p>
                <ul>
                  <li>
                    Social network when you grant permission to PUP Services to
                    access your data on one or more networks,
                  </li>
                  <li>
                    Service providers that help us determine a location based on
                    your IP address in order to customize certain services to
                    your location,
                  </li>
                  <li>
                    Partners with which we offer co-branded services or engage
                    in joint research activities, and
                  </li>
                  <li>
                    Publicly-available sources such as open government databases
                    or other data in the public domain.
                  </li>
                </ul>
                <p>
                  You have choices about the data we collect. When you are asked
                  to provide personal data, you may decline. But if you choose
                  not to provide data that is necessary to provide a service or
                  feature, you may not be able to use the Services.
                </p>
                <p>
                  The data we collect depends on the Services you use, and can
                  include the following:
                </p>
                <h4>Name and contact information</h4>
                <p>
                  We collect your first, middle and last name, and (if
                  available) name prefixes and suffixes (based on your
                  Philippine Statistics Office birth certificate), email
                  address, postal and mailing address, phone and mobile
                  number/s, and other similar contact information.
                </p>
                <h4>Credentials</h4>
                <p>
                  We collect student numbers, passwords, password hints, and
                  similar security information used for authentication and
                  account access.
                </p>
                <h4>Demographic data</h4>
                <p>
                  We collect data about you such as your date of birth, age,
                  sex, country, religion, written and spoken language/s, and
                  occupation (if applicable).
                </p>
                <h4>Payment data</h4>
                <p>
                  We collect data necessary to process your payment if you pay
                  fees online, such as your payment instrument number (such as a
                  reference number), and the security code associated with your
                  payment instrument. The University uses LANDBANK's Electronic
                  Payment System for its PUP Online Payment. LANDBANK collects
                  data necessary to process your payment, such as your payment
                  instrument number (such as an ATM number), and the security
                  code associated with your payment instrument.
                </p>
                <h4>Device and Usage data</h4>
                <p>
                  We collect data about your device and how you and your device
                  interact with our Services. For example, we collect:
                </p>
                <ul>
                  <li>
                    <strong>Service use data.</strong> We collect data about the
                    features you use, the items you purchase, and the web pages
                    you visit inside the Services. This data includes your
                    search queries or commands used in the Services.
                  </li>
                  <li>
                    <strong>
                      Device, connectivity and configuration data.
                    </strong>{" "}
                    We collect data about your device and the network you use to
                    connect to the Services. This includes data about the
                    operating systems and other software used in accessing the
                    Services, such as browsers. It also includes IP address,
                    device identifiers, regional and language settings.
                  </li>
                  <li>
                    <strong>Error reports and performance data.</strong> We
                    collect data about the performance of the Services and any
                    problems you experience with it. This data helps us to
                    diagnose problems in the Services you use, and to improve
                    our Services and provide solutions. Depending on your
                    product and settings, error reports can include data such as
                    the type or severity of the problem, details of the Service
                    related to an error, contents of the Service you were using
                    when an error occurred, and data about other software on
                    your device.
                  </li>
                  <li>
                    <strong>Technical Support Data.</strong> When you engage PUP
                    for technical support, we collect data about you and your
                    hardware, software, and other details related to the support
                    incident. Such data includes contact or authentication data,
                    the content of your message and other communications with
                    PUP support, data about the condition of the machine and the
                    application when the fault occurred and during diagnostics,
                    and system data about software installations and hardware
                    configurations.
                  </li>
                </ul>
                <h4>Third-party technologies</h4>
                <p>
                  Third-party apps/services, such as Facebook, Twitter, YouTube,
                  Office 365, etc., may collect data about your interests and
                  favorites. In addition to those you explicitly provide, your
                  interests and favorites may also be inferred or derived from
                  other data they collect. Third-party apps/services may collect
                  data about your contacts and relationships if you use their
                  services to manage contacts, or to communicate or interact
                  with other people or organizations. As such, you must read
                  their terms and privacy statement.
                </p>
                <h4>Office 365</h4>
                <p>
                  The University uses Office 365 for its PUP WebMail service.
                  Office 365 collects the content of your files and
                  communications when necessary to provide you with the products
                  you use. For example, if you receive an email using Outlook or
                  Exchange Online, Office 365 needs to collect the content of
                  that email to deliver it to your inbox, display it to you,
                  enable you to reply to it, and store it for you until you
                  choose to delete it. Examples of this data include: the
                  content of your documents, photos, music, or videos you upload
                  to a Office 365 service such as OneDrive, as well as the
                  content of your communications sent or received using Office
                  365 products such as Office 365, Outlook.com or Skype,
                  including the:
                </p>
                <ul>
                  <li>subject line and body of an email,</li>
                  <li>text or other content of an instant message,</li>
                  <li>audio and video recording of a video message, and</li>
                  <li>
                    audio recording and transcript of a voice message you
                    receive or a text message you dictate.
                  </li>
                </ul>
                <h4>Content</h4>
                <p>
                  We also collect the content of messages you send to us, such
                  as feedback and reviews you write, or questions and
                  information you provide for technical support. When you
                  contact us, such as for technical support, messages during
                  sessions with our offices and/or employees may be monitored
                  and recorded.
                </p>
                <h4>Physical appearance</h4>
                <p>
                  If you enter the University premises or other facilities, your
                  image may be captured by our security cameras. Furthermore,
                  your recent photo may be required when registering for an
                  entrance test or exam, and when applying for a PUP ID.
                </p>
                <h3>Use of Personal Data</h3>
                <p>
                  PUP uses the data we collect for three (3) fundamental
                  purposes:
                </p>
                <ul>
                  <li>
                    To operate as a higher education institution (HEI) and
                    provide (including improving and customizing) the services
                    we offer,
                  </li>
                  <li>
                    To send communication, including informative communication,
                    and
                  </li>
                  <li>
                    Promote the University, whether in our Services or in
                    third-party services supported by advertising.
                  </li>
                </ul>
                <p>
                  In carrying out these purposes, we combine data we collect to
                  give you a more seamless, consistent and customized
                  experience. However, to enhance privacy, we have safety
                  measures designed to prevent certain data combinations. For
                  example, when you are not yet authenticated (or not signed
                  in), we store data we collect from you separately from any
                  account information that directly identifies you (such as your
                  name, email address or contact number).
                </p>
                <p>
                  <strong>Providing and improving our Services.</strong> We use
                  data to provide and improve the Services we offer and perform
                  essential HEI operations. This includes operating the
                  Services, maintaining and improving the performance of the
                  Services, including developing new features, research, and
                  providing technical support. Examples of such uses include the
                  following:
                </p>
                <ul>
                  <li>
                    <strong>Providing the Services.</strong> We use data to
                    carry out your transactions with the University and to
                    provide our Services to you.
                  </li>
                  <li>
                    <strong>Technical support.</strong> We use data to diagnose
                    problems in the Services, repair the problem, and provide
                    other customer care and support services.
                  </li>
                  <li>
                    <strong>User account activation/deactivation.</strong> We
                    use data, including subscription and status identifiers, to
                    user accounts that requires activation/deactivation.
                  </li>
                  <li>
                    <strong>Improvement of Services.</strong> We use data to
                    continually improve our Services, including adding new
                    capabilities or features, such as using error reports to
                    improve processes, using search queries and clicks to
                    improve the relevancy of the search results and content
                    respectively, using usage data to determine what new
                    features to prioritize, or using feedback to improve content
                    accuracy.
                  </li>
                  <li>
                    <strong>Security and Safety.</strong> We use data to protect
                    the security and safety of our Services, to detect and
                    prevent fraud, to confirm the validity of user accounts, to
                    resolve disputes and enforce our policies. Our Services has
                    the capability to identify abusive actions and may block the
                    user and/or remove content if it violates our Terms.
                  </li>
                  <li>
                    <strong>University operations.</strong> We use data to make
                    aggregate analysis and business intelligence that enable the
                    University to operate, protect, make informed decisions, and
                    report on the performance of our Services.
                  </li>
                </ul>
                <p>
                  <strong>Communications.</strong> We use data we collect to
                  deliver and personalize our communication with you. For
                  example, we may contact you by email or other means to inform
                  or remind you of announcements and advisories that are
                  specific to user types (student, alumni, applicant, faculty
                  and/or employee), let you know when updates in the Services
                  are available, update you or inquire about a technical support
                  or repair request, invite you to participate in PUP Online
                  Survey, or tell you that you need to take action to keep your
                  account secured and active. Furthermore, you can sign up for
                  email subscriptions from the University's official social
                  media channels (Facebook, Twitter, YouTube, etc.) and choose
                  whether you wish to receive communications from PUP's social
                  media channels.
                </p>
                <p>
                  <strong>Advertising.</strong> Some of our Services are
                  supported by advertising. We share the data we collect with
                  third parties such as Office 365 (PUP WebMail), and social
                  media channels (Facebook, Twitter, YouTube, etc.) so that they
                  can select and deliver some of the ads you see on their sites
                  and apps, as well as other sites and apps serviced by these
                  solution providers. The ads that you see may be selected based
                  on your current location, search query, or the content you are
                  viewing. Other ads are targeted based on your likely interests
                  or other information learned about you over time using
                  demographic data, search queries, interests and favorites,
                  usage data from our own sites and apps and the sites and apps
                  of their advertisers and partners, and location data - which
                  they refer to as "interest-based advertising" in this
                  statement. To provide interest-based advertising, they combine
                  cookies placed on your device using information that they may
                  collect (such as IP address) when your browser interacts with
                  their websites. If you opt out of receiving interest-based
                  advertising, data associated with these cookies will not be
                  used. PUP and third-party technologies used in our Services
                  does not use what you say in email, chat, video calls or voice
                  mail, or your documents, photos or other personal files to
                  target ads to you.{" "}
                  <strong>
                    You can opt out of receiving interest-based advertising from
                    third parties by visiting their Website.
                  </strong>
                </p>
                <p>
                  Please note that some of our Services include links to
                  third-party products and services whose privacy practices
                  differ from the University. If you provide personal data to
                  third-party services, your data is governed by their privacy
                  statements.
                </p>
                <p>
                  For more information on how third parties protect your
                  privacy, here are the links to their privacy statements:
                </p>
                <ul>
                  <li>
                    Facebook:{" "}
                    <a
                      className="legal-link"
                      href="https://www.facebook.com/policy.php"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      https://www.facebook.com/policy.php
                    </a>
                  </li>
                  <li>
                    Google Analytics, Google Play, Google+:{" "}
                    <a
                      className="legal-link"
                      href="https://policies.google.com/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      https://policies.google.com/privacy
                    </a>
                  </li>
                  <li>
                    Instagram:{" "}
                    <a
                      className="legal-link"
                      href="https://help.instagram.com/519522125107875"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      https://help.instagram.com/519522125107875
                    </a>
                  </li>
                  <li>
                    Office 365 and Outlook.com:{" "}
                    <a
                      className="legal-link"
                      href="https://products.office.com/en/business/office-365-trust-center-privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      https://products.office.com/en/business/office-365-trust-center-privacy
                    </a>
                  </li>
                  <li>
                    OneDrive:{" "}
                    <a
                      className="legal-link"
                      href="https://privacy.microsoft.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      https://privacy.microsoft.com/
                    </a>
                  </li>
                  <li>
                    Twitter:{" "}
                    <a
                      className="legal-link"
                      href="https://twitter.com/en/privacy"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      https://twitter.com/en/privacy
                    </a>
                  </li>
                  <li>
                    UserReport.com:{" "}
                    <a
                      className="legal-link"
                      href="https://privacy.userreport.com/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      https://privacy.userreport.com/
                    </a>
                  </li>
                  <li>
                    YouTube:{" "}
                    <a
                      className="legal-link"
                      href="https://www.youtube.com/yt/about/policies/"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      https://www.youtube.com/yt/about/policies/
                    </a>
                  </li>
                </ul>
                <h3>Rationale in Sharing Personal Data</h3>
                <p>
                  We share your personal data with your consent or when
                  necessary to complete any transaction or provide services you
                  have requested or authorized. For example, we share your
                  content with third parties when you tell us to do so, such as
                  when you send an email using Office 365, share photos and
                  documents on OneDrive and/or SharePoint, or link accounts with
                  third-party services. When you provide data, such as your
                  name, to pay your tuition or application fee using PUP Online
                  Payment, we will share that data with our partner bank/s and
                  other entities that process online payment transactions, and
                  for fraud prevention and risk reduction.
                </p>
                <p>
                  In addition, we share personal data with partners working on
                  our behalf for the purposes described in this statement. For
                  example, third parties and/or partners that provides
                  technology support or assist in protecting and securing our
                  systems and services, or provide career opportunities for
                  students and alumni may need access to personal data to
                  provide those functions. In such cases, these companies must
                  abide by our data privacy and security requirements and are
                  not allowed to use personal data they receive from us for any
                  other purpose.
                </p>
                <p>
                  Finally, we will access, transfer, disclose, and preserve
                  personal data, including your content (such as the content of
                  your emails in PUP WebMail, Outlook.com, or files in private
                  folders on OneDrive), when we have a good faith belief that
                  doing so is necessary to:
                </p>
                <ol>
                  <li>
                    Comply with applicable law or respond to valid legal
                    process, including from law enforcement or other government
                    agencies,
                  </li>
                  <li>
                    Protect our stakeholders, for example to prevent spam or
                    attempts to defraud users of third-party products or
                    services, or to help prevent the loss of life or serious
                    injury of anyone,
                  </li>
                  <li>
                    Operate and maintain the security of our Services, including
                    prevention or stopping an attack on our computer systems,
                    networks, IT infrastructure, or
                  </li>
                  <li>
                    Protect the rights or property of PUP, including enforcing
                    the terms governing the use of the Services - however, if we
                    receive information indicating that someone is using our
                    Services to traffic in stolen intellectual or physical
                    property of PUP, we will not inspect a user's private
                    content ourselves, but we may refer the matter to law
                    enforcement.
                  </li>
                </ol>
                <h3>Accessing Your Personal Data</h3>
                <h4>PUP Student Information System (PUP SIS)</h4>
                <p>
                  If you are currently enrolled and have an active account in
                  the PUP SIS, you can always go to the PUP Office of the
                  University Registrar or PUP Branch/Campus Registrar to have
                  your personal information updated. As such, you are required
                  to present your PUP ID and required supporting documents.
                </p>
                <h4>PUP Human Resource Information System (PUP HRIS)</h4>
                <p>
                  If you are currently employed, you can always go to the PUP
                  HRIS 201 module to have your personal information updated. All
                  changes made will undergo validation and approval from your
                  supervisor and the PUP Human Resource Management Department
                  (PUP HRMD). As such, you are required to present your PUP ID
                  and required supporting documents.
                </p>
                <h4>PUP Online Document Request System (PUP ODRS)</h4>
                <p>
                  If you have an active account in the PUP ODRS, you can always
                  go to the PUP ODRS profile module to have your personal
                  information updated.
                </p>
                <h4>PUP iApply</h4>
                <p>
                  If you registered online for an entrance test/exam of the
                  University, (for PUP Sta. Mesa, Manila) you can always go to
                  the PUP ICT Office Helpdesk or (for PUP Branches and Campuses)
                  go to the PUP Office of the Branch/Campus Registrar and
                  Admissions to have your personal information updated. As such,
                  you are required to present a valid ID (school ID or any
                  government-issued ID) and required supporting documents.
                </p>
                <h4>Third-party product and services</h4>
                <p>
                  You can view or edit your personal data online for third-party
                  products and services. You can also make choices about
                  third-party's collection and use of your data. How you can
                  access or control your personal data will depend on which
                  products and services you use. For example:
                </p>
                <ul>
                  <li>
                    <strong>Office 365.</strong> You can see and control
                    activity data across Office 365 services at
                    <a
                      className="legal-link"
                      href="https://portal.office.com/account"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {" "}
                      portal.office.com/account
                    </a>
                    . From here, you can access or edit your profile and payment
                    information (if applicable), view and clear browsing,
                    search, and location data associated with your Office 365
                    account.
                  </li>
                </ul>
                <h4>Browser-Based Controls</h4>
                <p>
                  <strong>Cookie Controls.</strong> Relevant browser-based
                  cookie controls are described in the Cookies section of this
                  privacy statement.
                </p>
                <p>
                  <strong>Protection from Tracking.</strong> Most modern Web
                  browsers allow you to block third-party content, including
                  cookies, from any site. By limiting access to these sites, the
                  Web browser will limit the information these third-party sites
                  can collect about you.
                </p>
                <p>
                  <strong>Browser Controls for "Do Not Track."</strong> Most
                  modern Web browsers have "Do Not Track" (DNT) features that
                  can send a signal to the Web sites you visit indicating you do
                  not wish to be tracked.
                </p>
                <h3>Cookies and Similar Technologies</h3>
                <p>
                  The Services use cookies (small text files placed on your
                  device) and similar technologies to provide information to our
                  Web sites and Services, and to help collect data. The text in
                  a cookie often consists of a string of numbers, letters and
                  special characters that uniquely identifies your device, but
                  it can contain other information as well. Third-party
                  technologies use other identifiers for similar purposes, and
                  many of our Services and third-party providers also contain
                  web beacons or other similar technologies, as described below.
                </p>
                <h4>Our Use of Cookies and Similar Technologies</h4>
                <p>
                  The Services uses cookies and similar technologies for several
                  purposes, which includes:
                </p>
                <ul>
                  <li>
                    <strong>Sign-in and Authentication.</strong> When you sign
                    into the Services or third-party providers using your PUP
                    account, we store a unique ID number, and the time you
                    signed in, in an encrypted cookie on your device. This
                    cookie allows you to move from page to page within the
                    Services without having to sign in again on each page.
                  </li>
                  <li>
                    <strong>Remembering your Preferences and Settings.</strong>{" "}
                    Settings that enable our Services to operate properly or
                    that maintain your preferences over time may be stored on
                    your device. For example, if you signed in the Services, we
                    may store encrypted session data in a cookie so that you
                    will see the relevant information or services. These
                    preferences and settings are placed in a cookie on your
                    device until you clear browsing data using your Web browser.
                  </li>
                  <li>
                    <strong>Interest-Based Advertising.</strong> Third-party
                    providers use cookies to collect data about your online
                    activity and identify your interests so that the provided
                    ads are most relevant to you. You can opt out of receiving
                    interest-based advertising from third-party providers as
                    described in their privacy statement.
                  </li>
                  <li>
                    <strong>Analytics.</strong> In order to provide services,
                    cookies and other identifiers are used to gather usage and
                    performance data. For example, cookies are used to count the
                    number of unique visitors to a Service and used as
                    statistics about the operations of the Services.
                  </li>
                </ul>
                <p>
                  In addition to the cookies set when you use Services,
                  third-party providers may also set cookies when you use and/or
                  interact with the Services. In some instances, because the
                  University uses third-party technologies to provide services
                  on our behalf, such as online storage, webmail and site
                  analytics. In other instances, it is because our Services
                  contain content or ads from third parties, such as videos,
                  news content or ads delivered by other ad networks. Because
                  your device connects to those third parties' app servers to
                  retrieve that content, those third parties are able to set or
                  read their own cookies on your device and may collect
                  information about your online activities across online
                  services.
                </p>
                <h4>How to Control Cookies</h4>
                <p>
                  Most modern Web browsers automatically accept cookies and
                  provide controls that allow you to block or delete them.
                  Instructions for blocking or deleting cookies may be available
                  in each Web browser's privacy or help documentation (
                  <a
                    className="legal-link"
                    href="https://www.wikihow.com/Disable-Cookies"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    https://www.wikihow.com/Disable-Cookies
                  </a>
                  ).
                </p>
                <p>
                  Certain features of the Services depend on cookies. Please be
                  mindful that if you choose to block or disable cookies, you
                  may not be able to sign in or use specific features, and
                  preferences that are dependent on cookies may be gone. If you
                  choose to delete or disable cookies, preferences and settings
                  controlled by those cookies will be deleted and may need to be
                  created again.
                </p>
                <p>
                  Additional privacy controls that can impact cookies, including
                  the Tracking Protection feature of Web browsers, are described
                  in the Accessing Your Personal Data section of this privacy
                  statement.
                </p>
                <h4>Web Beacons and Analytics Services</h4>
                <p>
                  Third-party providers may contain electronic images known as
                  web beacons (also called single-pixel gifs) that are used to
                  help deliver cookies on our Services, count users who have
                  visited those Services and deliver co-branded services. Web
                  beacons are also included in their promotional email messages
                  or newsletters to determine whether you open and act on them.
                </p>
                <p>
                  Services often contain web beacons or similar technologies
                  from third-party analytics providers, which help compile
                  aggregated statistics about the effectiveness of service and
                  operations. These technologies enable the analytics providers
                  to set or read their own cookies or other identifiers on your
                  device, through which they can collect information about your
                  online activities across Services. However, these analytics
                  providers are prohibited from using web beacons on our
                  Services to collect or access information that directly
                  identifies you (such as your name or email address). You can
                  opt out of data collection or use by our analytics provider by
                  going to Google Analytics:
                  <a
                    className="legal-link"
                    href="https://tools.google.com/dlpage/gaoptout"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {" "}
                    tools.google.com/dlpage/gaoptout
                  </a>{" "}
                  (this requires you to install a browser add-on).
                </p>
                <h4>Other Similar Technologies</h4>
                <p>
                  In addition to standard cookies and web beacons, the Services
                  or third-party providers may use other similar technologies to
                  store and read data files on your device. This is typically
                  done to maintain your preferences or to improve speed and
                  performance by storing certain files locally. But, like
                  standard cookies, these technologies can also be used to store
                  a unique identifier for your device, which can then be used to
                  track behavior. These technologies may include Local Shared
                  Objects (or "Flash cookies").
                </p>
                <p>
                  <strong>Local Shared Objects or "Flash cookies."</strong>{" "}
                  Third-party providers that utilizes Adobe Flash technologies
                  use Local Shared Objects or "Flash cookies" to store data on
                  your device. To manage or block Flash cookies, go to
                  <a
                    className="legal-link"
                    href="http://www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager.html"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {" "}
                    www.macromedia.com/support/documentation/en/flashplayer/help/settings_manager.html
                  </a>
                  .
                </p>
                <h3>User Account</h3>
                <p>
                  With a user account, you can sign into the Services. Signing
                  into your account enables access to specific services, permits
                  you to access and use third-party services. When you sign into
                  your account to access a Service, that is recorded and
                  maintained. If you sign into a third-party service with your
                  user account, you may be asked to consent to share the account
                  data required by that service. With your @pup.edu.ph account,
                  you can sign into third-party services such as Office 365 and
                  OneDrive. We also refer to your user account as a work or
                  school account.
                </p>
                <h4>Creating and using your user account</h4>
                <p>
                  When we create your work or school account, you will be asked
                  for certain personal data and required documents as proof of
                  your current status in PUP (currently employed or enrolled),
                  and a unique ID number will be generated to identify your
                  account and associated information. Services require a real
                  and complete name. Some data in your user account, such as
                  your display name, email address and phone number, can be used
                  to assist others find and connect with you within the
                  Services. For example, people who know your display name,
                  email address or phone number can use it to search for you on
                  Office 365 and send you an invite to connect with them. Note
                  that when you are using your work or school email address, the
                  University manages that account.
                </p>
                <h4>Signing in</h4>
                <p>
                  When you sign into the Services, we create a record of your
                  sign-in, which includes the date and time, information about
                  the Service you signed into, your sign-in name, the unique
                  number assigned to your account, a unique identifier assigned
                  to your device, your IP address, your operating system and Web
                  browser version.
                </p>
                <h4>Signing into Office 365</h4>
                <p>
                  Signing into Office 365 using your account enables
                  personalization, provides seamless and consistent experiences
                  across products and devices, permits you to access and use
                  cloud data storage, allows you to make payments using payment
                  instruments stored in your Office 365 account, and enables
                  other enhanced features and settings. When you sign into your
                  account, you will stay signed in until you sign out. If you
                  add your Office 365 account to a Windows device (version 8 or
                  higher), Windows will automatically sign you into products
                  that use Office 365 account that you access on that device.
                  When you are signed in, some products will display your name
                  or username and your profile photo (if you have added one to
                  your profile) as part of your use of Office 365 products,
                  including in your communications, social interactions and
                  public posts.
                </p>
                <h4>Signing into third-party services</h4>
                <p>
                  If you sign into a third-party service using your work or
                  school account, you will be asked to consent to share the
                  account data required by that service. The third-party will
                  also receive the version number assigned to your user account
                  (a new version number is assigned each time you change your
                  sign-in data); and whether your account has been deactivated.
                  If you have consented to share your profile data, the
                  third-party service may display your name or username and your
                  profile photo (if you have added one to your profile) when you
                  are signed in to that third-party service. If you chose to
                  make payments to third-party merchants using your user
                  account, Office 365 will pass to the third-party information
                  stored in your Office 365 account necessary to process your
                  payment and fulfill your order (such as name, credit card
                  number, billing and shipping addresses, and relevant contact
                  information). The third-party can use or share the data it
                  receives when you sign in or make a purchase according to its
                  own practices and policies. You should carefully review the
                  privacy statement for each third-party service you sign into
                  and each merchant you purchase from to determine how it will
                  use the data it collects.
                </p>
                <h4>
                  Connecting your work or school account to your social network
                  accounts
                </h4>
                <p>
                  You may connect your work or school account to your accounts
                  on social networks such as Facebook, Twitter, or LinkedIn in
                  order to access data from those social networks from within
                  the Services. If you choose to do so, Office 365 will store
                  data about your social network accounts on their servers so
                  that they can display updated data from your social network
                  account.
                </p>
                <h3>Security of Personal Data</h3>
                <p>
                  PUP is committed to protecting the security of your personal
                  data. We use a variety of security technologies and procedures
                  to help protect your personal data from unauthorized access,
                  use or disclosure. For example, we store the personal data you
                  provide on computer systems that have limited access and are
                  in controlled facilities. When we transmit highly confidential
                  data (such as your name or password) over the Internet, we
                  protect it through the use of encryption.
                </p>
                <h3>
                  Location where your Personal Data is Stored and Processed
                </h3>
                <p>
                  Personal data collected by the PUP through the Services are
                  stored and processed in the University data center, in your
                  region or in any other country where PUP or its service
                  providers maintain facilities. Office 365 maintains data
                  centers in the United States, Canada, Brazil, Ireland, the
                  Netherlands, Austria, Finland, India, Singapore, Malaysia,
                  Hong Kong, Japan, and Australia. Typically, the primary
                  storage location of your personal data is in the Philippines,
                  often with a backup to a data center in another region. The
                  storage location(s) are chosen by Office 365 in order to
                  operate efficiently, to improve performance, and to create
                  redundancies in order to protect the data in the event of an
                  outage or other problem. We ensure that the data we collect
                  via the Services are processed according to the provisions of
                  this privacy statement and the requirements of applicable law.
                </p>
                <p>
                  When applicable, if third-party providers transfer personal
                  data to other countries, some of which have not been
                  determined to have an adequate level of data protection, they
                  might use a variety of legal mechanisms, including contracts,
                  to help ensure protections travel with your data.
                </p>
                <h3>Retention of Personal Data</h3>
                <p>
                  {" "}
                  The University retains personal data for as long as necessary
                  to provide the services and fulfill the transactions you have
                  requested or may request in the future, or for other essential
                  purposes such as complying with our commitments, legal
                  obligations, resolving disputes, and enforcing our agreements.
                  Because these needs can vary for different data types in the
                  context of different products, actual retention periods can
                  vary significantly. The criteria used to determine the
                  retention periods include:{" "}
                </p>{" "}
                <ul>
                  {" "}
                  <li>
                    {" "}
                    <b>
                      How long is the personal data needed to provide the
                      services operated by the University?
                    </b>{" "}
                    This includes such things as maintaining and improving the
                    performance of those services, keeping our systems secure,
                    and maintaining appropriate academic, student, and financial
                    records. This is the general rule that establishes the
                    baseline for most data retention periods.{" "}
                  </li>{" "}
                  <li>
                    {" "}
                    <b>
                      Do users provide, create, or maintain the data with the
                      expectation we will retain it until they affirmatively
                      remove it?
                    </b>{" "}
                    Examples include a document you store in OneDrive, or an
                    email message you keep in your Office 365 Outlook inbox, or
                    attachments made during online registration or reporting. In
                    such cases, PUP and/or the third-party provider maintains
                    the data until you actively delete it, such as by moving an
                    email from your Office 365 Outlook inbox to the Deleted
                    Items folder, and then emptying that folder (when your
                    Deleted Items folder is emptied, those emptied items remain
                    in their system for up to 30 days before final deletion).{" "}
                  </li>{" "}
                  <li>
                    {" "}
                    <b>
                      Is PUP subject to a legal, contractual, or similar
                      obligation to retain the data?
                    </b>{" "}
                    Examples can include mandatory data retention laws in the
                    Philippines (or applicable jurisdiction for third-party
                    providers), Government orders to preserve data relevant to
                    an investigation, or data that must be retained for the
                    purposes of due process.{" "}
                  </li>{" "}
                </ul>
                <h3>Collection of Data from Minors</h3>
                <p>
                  The University collects data from applicants or users below 18
                  years of age, which is necessary to provide the Services
                  (particularly for Junior and Senior High School).
                </p>
                <p>
                  Their user account is treated much like any other account. The
                  minor may have access to communication services like email,
                  instant messaging and online message boards and may be able to
                  communicate freely with other users of all ages.
                </p>
                <h3>Preview and Beta Releases</h3>
                <p>
                  The Services offer preview, beta or other pre-released
                  versions and features ("Previews") to enable you to evaluate
                  them while providing feedback, including performance and usage
                  data, to the University or the third-party provider. As a
                  result, previews can automatically collect additional data,
                  provide fewer controls, and otherwise employ different privacy
                  and security measures than those typically present in the
                  Services. If you participate in previews, we may contact you
                  about your feedback or your interest in continuing to use the
                  particular online service after general release.
                </p>
                <h3>Enforcement of this Privacy Statement</h3>
                <p>
                  In our quest to uphold our commitment to protecting the
                  privacy of your Personal Information, the University discloses
                  its information practices, and to have its privacy practices
                  reviewed for compliance. If you have questions regarding this
                  statement, you can contact us by e-mail:
                  <span className="legal-link">dataprivacy@pup.edu.ph</span>.
                </p>
                <h3>Changes to this Privacy Statement</h3>
                <p>
                  We will update this privacy statement when necessary. When we
                  make changes to this statement, we will revise the "last
                  updated" date at the top of the statement. For material
                  changes to the statement, or in how PUP will use personal
                  data, we will post notifications in the PUPWebSite and
                  official PUP social media channels. We encourage you to
                  periodically review this privacy statement to learn how the
                  University is protecting your information.
                </p>
                <h3>Contact Information</h3>
                <p>
                  The University welcomes your input and suggestions regarding
                  this privacy statement, or if you have a data privacy concern
                  or a question for the PUP Data Privacy Officer, please contact
                  us by e-mail.
                </p>
                <p>
                  <strong>PUP Online Services Privacy Statement</strong>
                  <br />
                  Polytechnic University of the Philippines
                  <br />
                  Information and Communications Technology Office
                  <br />
                  <span className="legal-link">dataprivacy@pup.edu.ph</span>
                </p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onRequestClose={handleClose}
      style={customStyles}
      contentLabel="Legal Information"
    >
      {getContent()}
    </Modal>
  );
};

export default LegalModals;
