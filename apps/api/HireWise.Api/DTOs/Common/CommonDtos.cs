namespace HireWise.Api.DTOs.Common;

public class Result
{
    public bool IsSuccess { get; }
    public string? Error { get; }
    public int StatusCode { get; }

    protected Result(bool isSuccess, string? error, int statusCode = 200)
    {
        IsSuccess = isSuccess;
        Error = error;
        StatusCode = statusCode;
    }

    public static Result Success(int statusCode = 200) => new(true, null, statusCode);
    public static Result Failure(string error, int statusCode = 400) => new(false, error, statusCode);
    public static Result NotFound(string error = "Resource not found") => new(false, error, 404);
    public static Result Unauthorized(string error = "Unauthorized") => new(false, error, 401);
    public static Result Forbidden(string error = "Forbidden") => new(false, error, 403);
    public static Result Conflict(string error = "Conflict detected") => new(false, error, 409);
}

public class Result<T> : Result
{
    public T? Value { get; }

    protected Result(bool isSuccess, T? value, string? error, int statusCode = 200)
        : base(isSuccess, error, statusCode)
    {
        Value = value;
    }

    public static Result<T> Success(T value, int statusCode = 200) => new(true, value, null, statusCode);
    public new static Result<T> Failure(string error, int statusCode = 400) => new(false, default, error, statusCode);
    public new static Result<T> NotFound(string error = "Resource not found") => new(false, default, error, 404);
    public new static Result<T> Unauthorized(string error = "Unauthorized") => new(false, default, error, 401);
    public new static Result<T> Forbidden(string error = "Forbidden") => new(false, default, error, 403);
    public new static Result<T> Conflict(string error = "Conflict detected") => new(false, default, error, 409);
}

public class ApiResponse<T>
{
    public bool Success { get; set; }
    public T? Data { get; set; }
    public string? Message { get; set; }
    public string? Error { get; set; }
    public DateTime Timestamp { get; set; } = DateTime.UtcNow;
    public string? CorrelationId { get; set; }

    public static ApiResponse<T> Ok(T data, string? message = null, string? correlationId = null) =>
        new() { Success = true, Data = data, Message = message, CorrelationId = correlationId };

    public static ApiResponse<T> Fail(string error, string? correlationId = null) =>
        new() { Success = false, Error = error, CorrelationId = correlationId };
}

public class PagedRequest
{
    public int Page { get; set; } = 1;
    public int PageSize { get; set; } = 20;
    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; } = true;
}

public class PagedResult<T>
{
    public IEnumerable<T> Items { get; set; } = new List<T>();
    public int Page { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public int TotalPages => (int)Math.Ceiling((double)TotalCount / PageSize);
    public bool HasPreviousPage => Page > 1;
    public bool HasNextPage => Page < TotalPages;

    public PagedResult() { }

    public PagedResult(IEnumerable<T> items, int count, int page, int pageSize)
    {
        Items = items;
        TotalCount = count;
        Page = page;
        PageSize = pageSize;
    }
}
