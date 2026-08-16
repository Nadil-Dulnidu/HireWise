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
    }
}

