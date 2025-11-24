# 08-21-2025 Kickoff Meeting Notes
*Project: Demo Portal Capstone*  
*Attendees: Senior Capstone Team, Contentstack Mentor (Sales Engineer)*

## 1. Meeting Overview
This meeting served as the official kickoff between the senior capstone team and our Contentstack mentor. The group reviewed the already-created architectural decision record (ADR-003) and clarified the project direction, expectations, and scope for the semester.

## 2. Review of ADR-003
Since ADR-003 was drafted prior to the meeting, we walked through the key points with our mentor:

- Demo materials are currently scattered across several storage systems.
- The proposed solution is to build a centralized demo portal using Contentstack (CMS), Next.js (frontend), and Supabase (authentication + backend).
- Option 2 in the ADR was chosen because it offers flexibility, aligns with Contentstack’s workflows, and provides a scalable foundation.

The mentor confirmed that the ADR’s overall direction matches actual needs within Sales Engineering and Solutions Architecture teams.

## 3. Mentor Feedback & Clarifications
Key points from the mentor:

- The portal should minimize friction for internal teams and approved partners.
- RBAC and content organization will be critically important.
- Performance and observability become significant once more users rely on the system.
- Establishing clear and scalable content models early will make development smoother.

We discussed balancing the academic requirements of the capstone with professional engineering practices.

## 4. Scope Discussion
**Primary goals for the capstone:**
- Functional auth flow via Supabase  
- Retrieve and display structured content from Contentstack  
- Clean, intuitive Next.js UI  
- Demo content sections (instructions, assets, references)

**Stretch goals (time-permitting):**
- Search, tagging, and filtering  
- Simple partner approval workflow  
- Demo deployment UI mock  
- Feature request upvoting component

The mentor encouraged prioritizing maintainability and clarity over feature volume.

## 5. Risks and Constraints
Risks discussed (aligned with ADR-001):

- **Adoption risk:** Users may continue relying on legacy sources if UX feels clunky.
- **Access control complexity:** Supporting internal + partner access introduces edge cases.
- **Performance:** Effective caching and clean content modeling will be important.
- **Timeline constraints:** Capstone deadlines require realistic scoping.

## 6. Next Steps
- Refine project plan based on ADR-003 and mentor suggestions.
- Begin defining Contentstack content models.
- Draft initial wireframes for the portal layout.
- Set up the development environment (Next.js, Supabase, Contentstack SDK).
- Schedule a follow-up architecture deep-dive.

## 7. Closing Notes
The mentor emphasized that this project meaningfully aligns with real-world workflows at Contentstack. The team ended with clear expectations and a shared understanding of technical direction and priorities.
