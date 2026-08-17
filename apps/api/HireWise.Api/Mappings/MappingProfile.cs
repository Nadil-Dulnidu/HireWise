using AutoMapper;
using HireWise.Api.DTOs.Companies;
using HireWise.Api.DTOs.Departments;
using HireWise.Api.DTOs.Jobs;
using HireWise.Api.DTOs.Users;
using HireWise.Api.Models;

namespace HireWise.Api.Mappings;

public class MappingProfile : Profile
{
    public MappingProfile()
    {
        // User Mappings
        CreateMap<User, UserDto>()
            .ForMember(dest => dest.CompanyName, opt => opt.MapFrom(src => src.Company != null ? src.Company.Name : null));

        CreateMap<UpdateProfileRequest, User>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Company Mappings
        CreateMap<Company, CompanyDto>()
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByUser != null ? $"{src.CreatedByUser.FirstName} {src.CreatedByUser.LastName}".Trim() : null))
            .ForMember(dest => dest.EmployeeCount, opt => opt.MapFrom(src => src.Employees.Count))
            .ForMember(dest => dest.DepartmentCount, opt => opt.MapFrom(src => src.Departments.Count))
            .ForMember(dest => dest.ActiveJobCount, opt => opt.MapFrom(src => src.Jobs.Count(j => j.Status == Models.Enums.JobStatus.OPEN)));

        CreateMap<CreateCompanyRequest, Company>();
        CreateMap<UpdateCompanyRequest, Company>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Department Mappings
        CreateMap<Department, DepartmentDto>()
            .ForMember(dest => dest.CompanyName, opt => opt.MapFrom(src => src.Company != null ? src.Company.Name : null))
            .ForMember(dest => dest.ActiveJobCount, opt => opt.MapFrom(src => src.Jobs.Count(j => j.Status == Models.Enums.JobStatus.OPEN)));

        CreateMap<CreateDepartmentRequest, Department>();
        CreateMap<UpdateDepartmentRequest, Department>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Job Mappings
        CreateMap<Job, JobDto>()
            .ForMember(dest => dest.CompanyName, opt => opt.MapFrom(src => src.Company.Name))
            .ForMember(dest => dest.CompanyLogoUrl, opt => opt.MapFrom(src => src.Company.LogoUrl))
            .ForMember(dest => dest.CompanyLocation, opt => opt.MapFrom(src => src.Company.Location))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : null))
            .ForMember(dest => dest.CreatedByName, opt => opt.MapFrom(src => src.CreatedByUser != null ? $"{src.CreatedByUser.FirstName} {src.CreatedByUser.LastName}".Trim() : null))
            .ForMember(dest => dest.ApplicationCount, opt => opt.MapFrom(src => src.Applications.Count));

        CreateMap<Job, JobSummaryDto>()
            .ForMember(dest => dest.CompanyName, opt => opt.MapFrom(src => src.Company.Name))
            .ForMember(dest => dest.CompanyLogoUrl, opt => opt.MapFrom(src => src.Company.LogoUrl))
            .ForMember(dest => dest.DepartmentName, opt => opt.MapFrom(src => src.Department != null ? src.Department.Name : null));

        CreateMap<CreateJobRequest, Job>();
        CreateMap<UpdateJobRequest, Job>()
            .ForAllMembers(opts => opts.Condition((src, dest, srcMember) => srcMember != null));

        // Resume Mappings
        CreateMap<Resume, DTOs.Resumes.ResumeDto>();

        // Application Mappings
        CreateMap<Application, DTOs.Applications.ApplicationDto>()
            .ForMember(dest => dest.JobTitle, opt => opt.MapFrom(src => src.Job.Title))
            .ForMember(dest => dest.JobLocation, opt => opt.MapFrom(src => src.Job.Location))
            .ForMember(dest => dest.JobEmploymentType, opt => opt.MapFrom(src => src.Job.EmploymentType))
            .ForMember(dest => dest.CompanyId, opt => opt.MapFrom(src => src.Job.CompanyId))
            .ForMember(dest => dest.CompanyName, opt => opt.MapFrom(src => src.Job.Company.Name))
            .ForMember(dest => dest.CompanyLogoUrl, opt => opt.MapFrom(src => src.Job.Company.LogoUrl))
            .ForMember(dest => dest.CandidateName, opt => opt.MapFrom(src => $"{src.Candidate.FirstName} {src.Candidate.LastName}".Trim()))
            .ForMember(dest => dest.CandidateEmail, opt => opt.MapFrom(src => src.Candidate.Email));

        CreateMap<Application, DTOs.Applications.ApplicationDetailDto>()
            .IncludeBase<Application, DTOs.Applications.ApplicationDto>()
            .ForMember(dest => dest.JobDescription, opt => opt.MapFrom(src => src.Job.Description))
            .ForMember(dest => dest.JobRequirements, opt => opt.MapFrom(src => src.Job.Requirements))
            .ForMember(dest => dest.JobSalaryMin, opt => opt.MapFrom(src => src.Job.SalaryMin))
            .ForMember(dest => dest.JobSalaryMax, opt => opt.MapFrom(src => src.Job.SalaryMax))
            .ForMember(dest => dest.JobSalaryCurrency, opt => opt.MapFrom(src => src.Job.SalaryCurrency))
            .ForMember(dest => dest.CandidatePhone, opt => opt.MapFrom(src => src.Candidate.Phone))
            .ForMember(dest => dest.CandidateProfileImageUrl, opt => opt.MapFrom(src => src.Candidate.ProfileImageUrl))
            .ForMember(dest => dest.HasInterviewScheduled, opt => opt.MapFrom(src => src.Interview != null))
            .ForMember(dest => dest.InterviewId, opt => opt.MapFrom(src => src.Interview != null ? src.Interview.Id : (Guid?)null));
    }
}

